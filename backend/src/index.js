import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import multer from 'multer';
import XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const VOTE_HASH_SECRET = process.env.VOTE_HASH_SECRET || 'dev-vote-secret';
const TOKEN_TTL_MINUTES = Number(process.env.JWT_TTL_MINUTES || 30);
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
};

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => `${req.ip}:${req.body?.matricula || ''}`,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);
app.use(morgan('combined'));

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const loginSchema = z.object({
  matricula: z.string().min(3).max(32),
  cpf: z.string().min(11).max(14),
});

const candidatoSchema = z.object({
  nome: z.string().min(3).max(120),
  setor: z.string().min(2).max(120),
  descricao: z.string().max(500).optional().nullable(),
  imagemUrl: z.string().url().optional().nullable(),
  campanhaUrl: z.string().url().optional().nullable(),
});

const votoSchema = z.object({
  candidatoId: z.coerce.number().int().positive().optional(),
  voto: z.string().min(1).max(150).optional(), // compatibilidade com versão anterior
});

function sanitizeCpf(cpf) {
  return cpf.replace(/\D/g, '');
}

function normalizeHeader(header) {
  if (!header) return '';
  return String(header)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-]+/g, '_');
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'sim', 'yes', 'y', 't'].includes(normalized);
}

function parseImportFile(file) {
  const filename = (file.originalname || '').toLowerCase();
  const isXlsx = filename.endsWith('.xlsx')
    || filename.endsWith('.xls')
    || (file.mimetype || '').includes('sheet')
    || (file.mimetype || '').includes('excel');
  let rows = [];

  if (isXlsx) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } else {
    const content = file.buffer.toString('utf8');
    const firstLine = content.split(/\r?\n/)[0] || '';
    const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';
    rows = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
    });
  }

  return rows.map((row, index) => {
    const normalized = {};
    Object.entries(row || {}).forEach(([key, value]) => {
      const normalizedKey = normalizeHeader(key);
      if (normalizedKey) {
        normalized[normalizedKey] = value;
      }
    });
    normalized.__row = index + 2;
    return normalized;
  });
}

function hashMatricula(matricula) {
  return crypto.createHash('sha256').update(`${matricula}:${VOTE_HASH_SECRET}`).digest('hex');
}

function generateToken({ id, matricula, role }) {
  return jwt.sign(
    {
      sub: id,
      matricula,
      role,
      matriculaHash: hashMatricula(matricula),
    },
    JWT_SECRET,
    { expiresIn: `${TOKEN_TTL_MINUTES}m` },
  );
}

async function logAuditoria({ tipo, matriculaHash, ip, userAgent, resultado, detalhes }, dbClient) {
  const target = dbClient || pool;
  try {
    await target.query(
      `INSERT INTO auditoria_votacao (tipo, matricula_hash, ip, user_agent, resultado, detalhes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tipo, matriculaHash || null, ip || null, userAgent || null, resultado, detalhes ? JSON.stringify(detalhes) : null],
    );
  } catch (error) {
    console.error('[AUDITORIA] Falha ao registrar log', error.message);
  }
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: 'Token não informado' });
  }
  const [, token] = header.split(' ');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub,
      matricula: decoded.matricula,
      role: decoded.role,
      matriculaHash: decoded.matriculaHash,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito à comissão CIPA' });
  }
  return next();
}

app.get(
  '/health',
  asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),
);

const loginHandler = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos de autenticação', detalhes: parsed.error.format() });
  }

  const { matricula } = parsed.data;
  const cpf = sanitizeCpf(parsed.data.cpf);
  const matriculaHash = hashMatricula(matricula);
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await pool.query(
    `SELECT id, matricula, cpf_hash, nome, setor, is_admin, ja_votou, votou_em
     FROM eleitores
     WHERE matricula = $1`,
    [matricula],
  );

  if (result.rowCount === 0) {
    await logAuditoria(
      {
        tipo: 'LOGIN',
        matriculaHash,
        ip,
        userAgent,
        resultado: 'FALHA',
        detalhes: { motivo: 'MATRICULA_INVALIDA' },
      },
    );
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const eleitor = result.rows[0];
  const senhaConfere = await bcrypt.compare(cpf, eleitor.cpf_hash);

  if (!senhaConfere) {
    await logAuditoria(
      {
        tipo: 'LOGIN',
        matriculaHash,
        ip,
        userAgent,
        resultado: 'FALHA',
        detalhes: { motivo: 'CPF_INVALIDO' },
      },
    );
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  await pool.query('UPDATE eleitores SET ultimo_login = NOW() WHERE id = $1', [eleitor.id]);
  await logAuditoria(
    {
      tipo: 'LOGIN',
      matriculaHash,
      ip,
      userAgent,
      resultado: 'SUCESSO',
    },
  );

  const token = generateToken({
    id: eleitor.id,
    matricula: eleitor.matricula,
    role: eleitor.is_admin ? 'ADMIN' : 'ELECTOR',
  });

  res.json({
    token,
    eleitor: {
      nome: eleitor.nome,
      matricula: eleitor.matricula,
      setor: eleitor.setor,
      isAdmin: eleitor.is_admin,
      jaVotou: eleitor.ja_votou,
      votouEm: eleitor.votou_em,
    },
  });
});

app.post('/auth', authLimiter, loginHandler);
app.post('/auth/login', authLimiter, loginHandler);

app.get(
  '/session',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      'SELECT id, nome, matricula, setor, is_admin, ja_votou, votou_em FROM eleitores WHERE id = $1',
      [req.user.id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Eleitor não encontrado' });
    }
    res.json(result.rows[0]);
  }),
);

app.get(
  '/candidatos',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, nome, setor, imagem AS imagem_url, descricao, campanha_url
       FROM candidatos
       ORDER BY nome ASC`,
    );
    res.json(result.rows);
  }),
);

app.post(
  '/candidatos',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = candidatoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', detalhes: parsed.error.format() });
    }
    const { nome, setor, descricao, imagemUrl, campanhaUrl } = parsed.data;
    await pool.query(
      `INSERT INTO candidatos (nome, setor, descricao, imagem, campanha_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [nome, setor, descricao || null, imagemUrl || null, campanhaUrl || null],
    );
    await logAuditoria({
      tipo: 'CADASTRO_CANDIDATO',
      matriculaHash: req.user.matriculaHash,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      resultado: 'SUCESSO',
      detalhes: { nome, setor },
    });
    res.status(201).json({ ok: true });
  }),
);

app.put(
  '/candidatos/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = candidatoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', detalhes: parsed.error.format() });
    }
    const candidatoId = Number(req.params.id);
    if (!Number.isInteger(candidatoId) || candidatoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { nome, setor, descricao, imagemUrl, campanhaUrl } = parsed.data;
    const result = await pool.query(
      `UPDATE candidatos
       SET nome = $1, setor = $2, descricao = $3, imagem = $4, campanha_url = $5
       WHERE id = $6`,
      [nome, setor, descricao || null, imagemUrl || null, campanhaUrl || null, candidatoId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Candidato não encontrado' });
    }

    await logAuditoria({
      tipo: 'ATUALIZA_CANDIDATO',
      matriculaHash: req.user.matriculaHash,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      resultado: 'SUCESSO',
      detalhes: { candidatoId },
    });

    res.json({ ok: true });
  }),
);

app.delete(
  '/candidatos/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const candidatoId = Number(req.params.id);
    if (!Number.isInteger(candidatoId) || candidatoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query('DELETE FROM candidatos WHERE id = $1', [candidatoId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Candidato não encontrado' });
    }
    await logAuditoria({
      tipo: 'REMOVE_CANDIDATO',
      matriculaHash: req.user.matriculaHash,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      resultado: 'SUCESSO',
      detalhes: { candidatoId },
    });
    res.json({ ok: true });
  }),
);

app.post(
  '/votar',
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user?.role === 'ADMIN') {
      return res.status(403).json({ error: 'Membros da comissão não podem registrar votos.' });
    }
    const parsed = votoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados de voto inválidos', detalhes: parsed.error.format() });
    }

    let candidatoId = parsed.data.candidatoId;
    if (!candidatoId && parsed.data.voto) {
      const candidatoResult = await pool.query('SELECT id FROM candidatos WHERE nome = $1', [parsed.data.voto]);
      if (candidatoResult.rowCount === 0) {
        return res.status(404).json({ error: 'Candidato não encontrado' });
      }
      candidatoId = candidatoResult.rows[0].id;
    }

    if (!candidatoId) {
      return res.status(400).json({ error: 'Candidato obrigatório' });
    }

    const client = await pool.connect();
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'];

    try {
      await client.query('BEGIN');

      const eleitorLock = await client.query(
        'SELECT ja_votou FROM eleitores WHERE id = $1 FOR UPDATE',
        [req.user.id],
      );

      if (eleitorLock.rowCount === 0) {
        await logAuditoria({ tipo: 'VOTO', matriculaHash: req.user.matriculaHash, ip, userAgent, resultado: 'FALHA', detalhes: { motivo: 'ELEITOR_INEXISTENTE' } }, client);
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Eleitor não encontrado' });
      }

      if (eleitorLock.rows[0].ja_votou) {
        await logAuditoria({ tipo: 'VOTO', matriculaHash: req.user.matriculaHash, ip, userAgent, resultado: 'FALHA', detalhes: { motivo: 'DUPLICADO' } }, client);
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Voto já registrado anteriormente' });
      }

      const candidatoExiste = await client.query('SELECT id, nome FROM candidatos WHERE id = $1', [candidatoId]);
      if (candidatoExiste.rowCount === 0) {
        await logAuditoria({ tipo: 'VOTO', matriculaHash: req.user.matriculaHash, ip, userAgent, resultado: 'FALHA', detalhes: { motivo: 'CANDIDATO_INEXISTENTE' } }, client);
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Candidato não encontrado' });
      }

      const registradoEm = new Date();
      const nonce = uuidv4();
      const hashIntegridade = crypto
        .createHmac('sha256', VOTE_HASH_SECRET)
        .update(`${candidatoId}|${registradoEm.toISOString()}|${nonce}`)
        .digest('hex');

      await client.query(
        `INSERT INTO votos (candidato_id, hash_integridade, registrado_em, nonce)
         VALUES ($1, $2, $3, $4)`,
        [candidatoId, hashIntegridade, registradoEm, nonce],
      );

      await client.query(
        'UPDATE eleitores SET ja_votou = TRUE, votou_em = $1 WHERE id = $2',
        [registradoEm, req.user.id],
      );

      await logAuditoria(
        {
          tipo: 'VOTO',
          matriculaHash: req.user.matriculaHash,
          ip,
          userAgent,
          resultado: 'SUCESSO',
          detalhes: { hashIntegridade },
        },
        client,
      );

      await client.query('COMMIT');
      res.status(201).json({
        ok: true,
        registradoEm: registradoEm.toISOString(),
        hashIntegridade,
        candidato: {
          id: candidatoExiste.rows[0].id,
          nome: candidatoExiste.rows[0].nome,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),
);

app.get(
  '/resultados',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT c.id, c.nome, c.setor, COUNT(v.id) AS total_votos
       FROM candidatos c
       LEFT JOIN votos v ON v.candidato_id = c.id
       GROUP BY c.id, c.nome, c.setor
       ORDER BY total_votos DESC, c.nome ASC`,
    );
    res.json(result.rows);
  }),
);

app.get(
  '/admin/eleitores',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, nome, matricula, setor, ja_votou, votou_em, ultimo_login
       FROM eleitores
       ORDER BY nome ASC`,
    );
    res.json(result.rows);
  }),
);

app.post(
  '/admin/eleitores/import',
  authenticate,
  requireAdmin,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo nao enviado' });
    }

    const rows = parseImportFile(req.file);
    if (!rows.length) {
      return res.status(400).json({ error: 'Arquivo vazio ou sem cabecalho' });
    }

    const errors = [];
    const seen = new Set();
    let inserted = 0;
    let updated = 0;

    const client = await pool.connect();
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'];

    try {
      await client.query('BEGIN');

      for (const row of rows) {
        const rowNumber = row.__row || null;
        const matricula = String(row.matricula || '').trim();
        const cpf = sanitizeCpf(String(row.cpf || ''));
        const nome = String(row.nome || '').trim();
        const setor = String(row.setor || '').trim();
        const isAdmin = parseBoolean(row.is_admin ?? row.admin ?? row.administrador);

        if (!matricula) {
          errors.push({ row: rowNumber, error: 'matricula obrigatoria' });
          continue;
        }

        if (seen.has(matricula)) {
          errors.push({ row: rowNumber, error: 'matricula duplicada no arquivo' });
          continue;
        }
        seen.add(matricula);

        if (cpf.length !== 11) {
          errors.push({ row: rowNumber, error: 'cpf invalido' });
          continue;
        }

        if (!nome) {
          errors.push({ row: rowNumber, error: 'nome obrigatorio' });
          continue;
        }

        if (!setor) {
          errors.push({ row: rowNumber, error: 'setor obrigatorio' });
          continue;
        }

        const cpfHash = await bcrypt.hash(cpf, 10);
        const result = await client.query(
          `INSERT INTO eleitores (matricula, cpf_hash, nome, setor, is_admin)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (matricula)
           DO UPDATE SET cpf_hash = EXCLUDED.cpf_hash,
                         nome = EXCLUDED.nome,
                         setor = EXCLUDED.setor,
                         is_admin = EXCLUDED.is_admin
           RETURNING (xmax = 0) AS inserted`,
          [matricula, cpfHash, nome, setor, isAdmin],
        );

        if (result.rows[0]?.inserted) {
          inserted += 1;
        } else {
          updated += 1;
        }
      }

      await client.query('COMMIT');
      await logAuditoria({
        tipo: 'IMPORT_ELEITORES',
        matriculaHash: req.user.matriculaHash,
        ip,
        userAgent,
        resultado: 'SUCESSO',
        detalhes: {
          total: rows.length,
          inserted,
          updated,
          invalid: errors.length,
          arquivo: req.file.originalname,
        },
      });

      return res.json({
        ok: true,
        total: rows.length,
        inserted,
        updated,
        invalid: errors.length,
        errors: errors.slice(0, 50),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      await logAuditoria({
        tipo: 'IMPORT_ELEITORES',
        matriculaHash: req.user.matriculaHash,
        ip,
        userAgent,
        resultado: 'FALHA',
        detalhes: {
          arquivo: req.file.originalname,
          erro: error.message,
        },
      });
      throw error;
    } finally {
      client.release();
    }
  }),
);

app.post(
  '/admin/eleitores/:id/reset-voto',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const eleitorId = Number(req.params.id);
    if (!Number.isInteger(eleitorId) || eleitorId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query(
      'UPDATE eleitores SET ja_votou = FALSE, votou_em = NULL WHERE id = $1',
      [eleitorId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Eleitor não encontrado' });
    }
    await logAuditoria({
      tipo: 'RESET_VOTO',
      matriculaHash: req.user.matriculaHash,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      resultado: 'SUCESSO',
      detalhes: { eleitorId },
    });
    res.json({ ok: true });
  }),
);

app.get(
  '/admin/auditoria',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, tipo, matricula_hash, ip, user_agent, resultado, detalhes, criado_em
       FROM auditoria_votacao
       ORDER BY criado_em DESC
       LIMIT 200`,
    );
    res.json(result.rows);
  }),
);

app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err);
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Dados inválidos', detalhes: err.format() });
  }
  return res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
