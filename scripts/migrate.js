/**
 * Run Alembic-equivalent migrations directly via Node.js + pg.
 * Usage: node scripts/migrate.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

// Node.js on this machine resolves DNS through 127.0.0.1 which has nothing
// listening on port 53. Override to use public DNS so Supabase hostname resolves.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Convert asyncpg URL to standard postgres URL
let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace('postgresql+asyncpg://', 'postgresql://');

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL not set in .env');
  process.exit(1);
}

console.log('Connecting to Supabase…');

async function run() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected.\n');

  // ── Ensure alembic_version table exists ──────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS alembic_version (
      version_num VARCHAR(32) NOT NULL,
      CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
    )
  `);

  // Check current version
  const { rows } = await client.query('SELECT version_num FROM alembic_version');
  const current = rows.length > 0 ? rows[0].version_num : null;
  console.log('Current DB version:', current ?? '(none — fresh database)');

  if (current === '0003') {
    console.log('\nAll migrations already applied. Nothing to do.');
    await client.end();
    return;
  }

  // ── Migration 0000: Create all tables ────────────────────────────────────
  if (!current) {
    console.log('\nApplying 0000_create_all_tables…');

    await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log('  ✓ pgvector extension');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        supabase_uid  VARCHAR     UNIQUE,
        email         VARCHAR     NOT NULL UNIQUE,
        name          VARCHAR,
        age           INTEGER,
        student_level VARCHAR(10),
        parental_consent_at TIMESTAMPTZ,
        anthropic_api_key_encrypted VARCHAR,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ix_users_supabase_uid ON users (supabase_uid)
    `);
    console.log('  ✓ users');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lms_connections (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        UUID        NOT NULL REFERENCES users(id),
        provider       VARCHAR(50) NOT NULL,
        credentials    JSONB,
        config         JSONB,
        last_synced_at TIMESTAMPTZ,
        is_active      BOOLEAN     NOT NULL DEFAULT true
      )
    `);
    console.log('  ✓ lms_connections');

    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID        NOT NULL REFERENCES users(id),
        filename    VARCHAR,
        file_type   VARCHAR(20),
        size_bytes  INTEGER,
        course_name VARCHAR,
        subject     VARCHAR,
        ingested_at TIMESTAMPTZ,
        chunk_count INTEGER,
        status      VARCHAR(20) NOT NULL DEFAULT 'pending'
      )
    `);
    console.log('  ✓ documents');

    await client.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id   UUID    NOT NULL REFERENCES documents(id),
        content       TEXT    NOT NULL,
        chunk_index   INTEGER NOT NULL,
        metadata      JSONB
      )
    `);
    // Add pgvector column via raw SQL (type not in standard SA dialect)
    await client.query(`
      ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding vector(1024)
    `);
    console.log('  ✓ document_chunks (with vector(1024) embedding)');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id            UUID        NOT NULL REFERENCES users(id),
        lms_connection_id  UUID        REFERENCES lms_connections(id),
        external_id        VARCHAR,
        title              VARCHAR     NOT NULL,
        description        TEXT,
        course_name        VARCHAR,
        subject            VARCHAR,
        due_date           TIMESTAMPTZ,
        status             VARCHAR(20) NOT NULL DEFAULT 'pending',
        priority           INTEGER,
        lms_url            VARCHAR,
        synced_at          TIMESTAMPTZ
      )
    `);
    console.log('  ✓ tasks');

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID        NOT NULL REFERENCES users(id),
        title      VARCHAR,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log('  ✓ chat_sessions');

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id      UUID        NOT NULL REFERENCES chat_sessions(id),
        role            VARCHAR(20) NOT NULL,
        content         TEXT        NOT NULL,
        intent          VARCHAR(50),
        rag_chunks_used JSONB,
        tokens_used     INTEGER,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log('  ✓ chat_messages');

    await client.query(`
      INSERT INTO alembic_version (version_num) VALUES ('0000')
      ON CONFLICT DO NOTHING
    `);
    console.log('\n  → version stamped: 0000');
  }

  // ── Migrations 0001, 0002, 0003 are no-ops (already in 0000) ─────────────
  const noOps = ['0001', '0002', '0003'];
  for (const v of noOps) {
    const { rows: vrows } = await client.query(
      'SELECT 1 FROM alembic_version WHERE version_num = $1', [v]
    );
    if (vrows.length === 0) {
      // Replace previous version stamp with this one
      await client.query('DELETE FROM alembic_version');
      await client.query('INSERT INTO alembic_version (version_num) VALUES ($1)', [v]);
      console.log(`  → version stamped: ${v} (no-op migration)`);
    }
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  console.log('\n── Verification ──────────────────────────────────────────');
  const tables = ['users', 'lms_connections', 'documents', 'document_chunks',
                  'tasks', 'chat_sessions', 'chat_messages'];
  for (const t of tables) {
    const { rows: tr } = await client.query(
      `SELECT to_regclass('public.${t}') AS tbl`
    );
    const exists = tr[0].tbl !== null;
    console.log(`  ${exists ? '✓' : '✗'} ${t}`);
  }

  // Check pgvector
  const { rows: extRows } = await client.query(
    `SELECT extname FROM pg_extension WHERE extname = 'vector'`
  );
  console.log(`  ${extRows.length > 0 ? '✓' : '✗'} pgvector extension`);

  // Check embedding column
  const { rows: colRows } = await client.query(`
    SELECT data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'document_chunks' AND column_name = 'embedding'
  `);
  if (colRows.length > 0) {
    console.log(`  ✓ document_chunks.embedding (${colRows[0].udt_name})`);
  } else {
    console.log(`  ✗ document_chunks.embedding MISSING`);
  }

  const { rows: verRows } = await client.query('SELECT version_num FROM alembic_version');
  console.log(`\nFinal DB version: ${verRows[0]?.version_num ?? 'unknown'}`);
  console.log('\nMigration complete.');

  await client.end();
}

run().catch(err => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
