import { pool } from '../database/db';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { Role, User, UserWithPassword } from '../../domain/entities/User';

function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapUserWithPassword(row: any): UserWithPassword {
  return { ...mapUser(row), passwordHash: row.password_hash };
}

export class PostgresUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
    return rows[0] ? mapUserWithPassword(rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const { rows } = await pool.query(`SELECT * FROM users ORDER BY created_at ASC`);
    return rows.map(mapUser);
  }

  async create(data: { email: string; passwordHash: string; role?: Role }): Promise<User> {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *`,
      [data.email.toLowerCase(), data.passwordHash, data.role || 'editor']
    );
    return mapUser(rows[0]);
  }

  async updateRole(id: string, role: Role): Promise<User | null> {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [role, id]
    );
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async setActive(id: string, isActive: boolean): Promise<User | null> {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [isActive, id]
    );
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [passwordHash, id]
    );
  }
}