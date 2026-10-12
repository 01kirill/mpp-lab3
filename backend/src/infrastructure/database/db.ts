import { Pool } from 'pg';
import { env } from '../../config/env';

export const pool = new Pool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
});

// Миграции применяются по порядку и один раз: номер = индекс + 1, учёт в schema_migrations.
// Новые изменения схемы — только добавлением элемента в конец массива.
const MIGRATIONS: string[] = [
  `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_hash VARCHAR(255) NOT NULL,
      user_agent TEXT,
      ip VARCHAR(64),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      location VARCHAR(255),
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      all_day BOOLEAN NOT NULL DEFAULT FALSE,
      color VARCHAR(20) NOT NULL DEFAULT '#4285f4',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100),
      size_bytes BIGINT NOT NULL DEFAULT 0,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(refresh_hash);
    CREATE INDEX IF NOT EXISTS idx_resets_hash ON password_resets(token_hash);
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
    CREATE INDEX IF NOT EXISTS idx_events_end_time ON events(end_time);
    CREATE INDEX IF NOT EXISTS idx_attachments_event_id ON attachments(event_id);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_events_user_start ON events(user_id, start_time);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id) WHERE revoked_at IS NULL;
  `,
  // All-day события переходят с «локальной полуночи создателя» на плавающую UTC-дату.
  // Ближайшая UTC-полночь к локальной полуночи — та же календарная дата для поясов UTC−12…UTC+12.
  `
    UPDATE events SET
      start_time = date_trunc('day', start_time + interval '12 hours', 'UTC'),
      end_time = date_trunc('day', end_time + interval '1 millisecond' + interval '12 hours', 'UTC') - interval '1 millisecond'
    WHERE all_day;
  `,
];

export async function runMigrations(): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  const { rows } = await pool.query(`SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations`);
  for (let v = rows[0].v + 1; v <= MIGRATIONS.length; v++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(MIGRATIONS[v - 1]);
      await client.query(`INSERT INTO schema_migrations (version) VALUES ($1)`, [v]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

/** Создаёт администратора, если в системе нет ни одного. Возвращает текст для лога. */
export async function seedAdmin(email: string, hashPassword: () => Promise<string>): Promise<string> {
  const { rows } = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (rows.length > 0) return 'admin.exists';

  const { rowCount } = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [email.toLowerCase(), await hashPassword()]
  );
  return rowCount ? 'admin.created' : 'admin.email_taken';
}

/** Удаляет истёкшие и отозванные сессии и отработавшие токены сброса. Возвращает число удалённых строк. */
export async function purgeExpiredAuthData(): Promise<{ sessions: number; resets: number }> {
  const s = await pool.query(`DELETE FROM sessions WHERE expires_at < now() OR revoked_at IS NOT NULL`);
  const r = await pool.query(`DELETE FROM password_resets WHERE expires_at < now() OR used_at IS NOT NULL`);
  return { sessions: s.rowCount ?? 0, resets: r.rowCount ?? 0 };
}
