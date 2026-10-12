import { pool } from '../database/db';
import { IPasswordResetRepository } from '../../domain/repositories/IPasswordResetRepository';
import { PasswordReset } from '../../domain/entities/User';

function mapRow(row: any): PasswordReset {
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at.toISOString(),
    usedAt: row.used_at ? row.used_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresPasswordResetRepository implements IPasswordResetRepository {
  async create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordReset> {
    const { rows } = await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *`,
      [data.userId, data.tokenHash, data.expiresAt]
    );
    return mapRow(rows[0]);
  }

  async findByHash(tokenHash: string): Promise<PasswordReset | null> {
    const { rows } = await pool.query(`SELECT * FROM password_resets WHERE token_hash = $1`, [tokenHash]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async consume(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      `UPDATE password_resets SET used_at = now() WHERE id = $1 AND used_at IS NULL AND expires_at > now()`,
      [id]
    );
    return (rowCount ?? 0) > 0;
  }
}
