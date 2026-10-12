import { pool } from '../database/db';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { Role, Session } from '../../domain/entities/User';

function mapSession(row: any): Session {
  return {
    id: row.id,
    userId: row.user_id,
    userAgent: row.user_agent,
    ip: row.ip,
    expiresAt: row.expires_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    revokedAt: row.revoked_at ? row.revoked_at.toISOString() : null,
  };
}

export class PostgresSessionRepository implements ISessionRepository {
  async create(data: {
    userId: string;
    refreshHash: string;
    userAgent: string | null;
    ip: string | null;
    expiresAt: Date;
  }): Promise<Session> {
    const { rows } = await pool.query(
      `INSERT INTO sessions (user_id, refresh_hash, user_agent, ip, expires_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.refreshHash, data.userAgent, data.ip, data.expiresAt]
    );
    return mapSession(rows[0]);
  }

  async findById(id: string): Promise<(Session & { refreshHash: string; role: Role; isActive: boolean }) | null> {
    const { rows } = await pool.query(
      `SELECT s.*, u.role, u.is_active FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    return { ...mapSession(rows[0]), refreshHash: rows[0].refresh_hash, role: rows[0].role, isActive: rows[0].is_active };
  }

  async findAllActive(): Promise<(Session & { email: string })[]> {
    const { rows } = await pool.query(
      `SELECT s.*, u.email FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.revoked_at IS NULL AND s.expires_at > now()
       ORDER BY s.created_at DESC`
    );
    return rows.map((r: any) => ({ ...mapSession(r), email: r.email }));
  }

  async rotate(id: string, refreshHash: string, expiresAt: Date): Promise<void> {
    await pool.query(`UPDATE sessions SET refresh_hash = $1, expires_at = $2 WHERE id = $3`, [refreshHash, expiresAt, id]);
  }

  async revoke(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      `UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await pool.query(
      `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }
}
