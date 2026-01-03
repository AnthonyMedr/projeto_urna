<div align="center">

# Urna Eletronica CIPA 2025

Fluxo completo de votacao corporativa com autenticacao segura, sigilo de voto, auditoria antifraude e painel administrativo.

</div>

## Principais recursos

- Autenticacao por matricula + CPF (hash/salt) com geracao de JWT e limitacao de tentativas.
- Regra de voto unico com bloqueio transacional, registro de IP/UA e hash de integridade do voto (HMAC).
- Voto anonimizado: o vinculo entre eleitor e voto e quebrado apos a validacao.
- Registro de auditoria (`auditoria_votacao`) para logar logins, tentativas invalidas, votos, reset e acoes administrativas.
- Painel administrativo (CIPA) com cadastro/edicao de candidatos, parciais atualizaveis, gestao de eleitores (reset de voto), importacao via planilha e consulta aos logs de auditoria.
- Fluxo guiado no frontend: Login → Escolha → Confirmacao → Voto computado, com feedback visual e recibo.

## Estrutura

```
backend/   API Express + PostgreSQL
frontend/  Aplicacao React (Create React App)
```

## Banco de dados

```sql
CREATE TABLE eleitores (
  id SERIAL PRIMARY KEY,
  matricula VARCHAR(32) UNIQUE NOT NULL,
  cpf_hash TEXT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  setor VARCHAR(120) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  ja_votou BOOLEAN DEFAULT FALSE,
  votou_em TIMESTAMP,
  ultimo_login TIMESTAMP
);

CREATE TABLE candidatos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  setor VARCHAR(120) NOT NULL,
  descricao TEXT,
  imagem TEXT,
  campanha_url TEXT
);

CREATE TABLE votos (
  id SERIAL PRIMARY KEY,
  candidato_id INTEGER REFERENCES candidatos(id),
  hash_integridade TEXT NOT NULL,
  nonce UUID NOT NULL,
  registrado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE auditoria_votacao (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(40) NOT NULL,
  matricula_hash TEXT,
  ip VARCHAR(64),
  user_agent TEXT,
  resultado VARCHAR(20) NOT NULL,
  detalhes JSONB,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);
```

> Gere `cpf_hash` com `bcrypt`: `bcrypt.hashSync(cpfSomenteNumeros, 10)`.

## Variaveis de ambiente (backend)

| Variavel | Descricao |
| --- | --- |
| `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGDATABASE`, `PGPORT` | Conexao PostgreSQL. |
| `PORT` | Porta do backend (padrao `3001`). |
| `JWT_SECRET` | Segredo para assinar tokens de sessao. |
| `JWT_TTL_MINUTES` | Validade do token (padrao `30`). |
| `VOTE_HASH_SECRET` | Segredo para gerar hash de integridade dos votos. |
| `CORS_ORIGINS` | Lista separada por virgula com os dominios autorizados no frontend. |

## Rodando o backend

```bash
cd backend
npm install
npm start
```

Endpoints relevantes:

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `POST /auth` | Login (matricula + CPF) → retorna `{ token, eleitor }`. |
| `GET /session` | Retorna informacoes do eleitor logado. |
| `GET /candidatos` | Lista de candidatos (autenticado). |
| `POST/PUT/DELETE /candidatos` | CRUD de candidatos (admin). |
| `POST /votar` | Registra voto unico (autenticado). |
| `GET /resultados` | Totais por candidato (admin). |
| `GET /admin/eleitores` | Lista eleitores e status (admin). |
| `POST /admin/eleitores/import` | Importa eleitores via planilha (admin). |
| `POST /admin/eleitores/:id/reset-voto` | Libera um eleitor para revotar (admin). |
| `GET /admin/auditoria` | Ultimos eventos de auditoria (admin). |

## Rodando o frontend

```bash
cd frontend
npm install
npm start
```

Variavel opcional: `REACT_APP_API_URL` para apontar para outro backend (padrao `http://localhost:3001`).

## Fluxo do usuario

1. **Autenticacao:** matricula + CPF → validacao e criacao do token.
2. **Escolha:** lista com foto, setor, descricao e link da campanha.
3. **Confirmacao:** revisao dos dados selecionados.
4. **Voto computado:** recibo com timestamp e hash de integridade.

O painel administrativo e carregado apenas para usuarios com `is_admin = true`, apresentando formulario de candidatos, parciais protegidas, lista de eleitores com reset de voto e logs de auditoria.

## Importacao de eleitores

O import aceita CSV ou XLSX com cabecalhos:

```
matricula,cpf,nome,setor,is_admin
```

- `cpf` deve conter apenas numeros (11 digitos).
- `is_admin` e opcional (true/false/1/0/sim/nao).
- Linhas invalidas sao retornadas no resultado do import.

## Proximos passos

- Exportacao de relatorios finais em PDF/CSV e API para auditoria externa.
- Monitoramento em tempo real (WebSocket/SSE) para parciais.
- Armazenamento imutavel (WORM) dos logs de auditoria para reforcar o antifraude.
