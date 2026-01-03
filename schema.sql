-- Schema SQL para Urna CIPA 2025 (PostgreSQL)

CREATE TABLE IF NOT EXISTS eleitores (
  id SERIAL PRIMARY KEY,
  matricula VARCHAR(32) UNIQUE NOT NULL,
  cpf_hash TEXT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  setor VARCHAR(120) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ja_votou BOOLEAN NOT NULL DEFAULT FALSE,
  votou_em TIMESTAMP,
  ultimo_login TIMESTAMP,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eleitores_votou ON eleitores (ja_votou);
CREATE INDEX IF NOT EXISTS idx_eleitores_setor ON eleitores (setor);

CREATE TABLE IF NOT EXISTS candidatos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  setor VARCHAR(120) NOT NULL,
  descricao TEXT,
  imagem TEXT,
  campanha_url TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votos (
  id SERIAL PRIMARY KEY,
  candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  hash_integridade TEXT NOT NULL,
  nonce UUID NOT NULL UNIQUE,
  registrado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_votos_candidato ON votos (candidato_id);
CREATE INDEX IF NOT EXISTS idx_votos_registrado_em ON votos (registrado_em);

CREATE TABLE IF NOT EXISTS auditoria_votacao (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(40) NOT NULL,
  matricula_hash TEXT,
  ip VARCHAR(64),
  user_agent TEXT,
  resultado VARCHAR(20) NOT NULL,
  detalhes JSONB,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tipo ON auditoria_votacao (tipo);
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria_votacao (criado_em DESC);

CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_eleitores_updated ON eleitores;
CREATE TRIGGER trg_eleitores_updated
BEFORE UPDATE ON eleitores
FOR EACH ROW EXECUTE FUNCTION set_timestamp();

DROP TRIGGER IF EXISTS trg_candidatos_updated ON candidatos;
CREATE TRIGGER trg_candidatos_updated
BEFORE UPDATE ON candidatos
FOR EACH ROW EXECUTE FUNCTION set_timestamp();
