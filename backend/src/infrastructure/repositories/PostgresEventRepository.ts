import { pool } from '../database/db';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { CalendarEvent, NewCalendarEvent } from '../../domain/entities/Event';

function mapRow(row: any): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    ownerEmail: row.owner_email ?? null,
    title: row.title,
    description: row.description,
    location: row.location,
    startTime: row.start_time.toISOString(),
    endTime: row.end_time.toISOString(),
    allDay: row.all_day,
    color: row.color,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

// Добавляет email владельца к строкам событий из CTE или подзапроса с именем e
const WITH_OWNER = `SELECT e.*, u.email AS owner_email FROM e LEFT JOIN users u ON u.id = e.user_id`;

export class PostgresEventRepository implements IEventRepository {
  async findAll(userId: string | null, rangeStart?: string, rangeEnd?: string): Promise<CalendarEvent[]> {
    const params: any[] = [];
    const where: string[] = [];
    if (userId) {
      params.push(userId);
      where.push(`user_id = $${params.length}`);
    }
    if (rangeStart && rangeEnd) {
      params.push(rangeEnd, rangeStart);
      where.push(`start_time <= $${params.length - 1} AND end_time >= $${params.length}`);
    }
    const filter = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `WITH e AS (SELECT * FROM events${filter}) ${WITH_OWNER} ORDER BY e.start_time ASC`,
      params
    );
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    const { rows } = await pool.query(`WITH e AS (SELECT * FROM events WHERE id = $1) ${WITH_OWNER}`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(userId: string, data: NewCalendarEvent): Promise<CalendarEvent> {
    const { rows } = await pool.query(
      `WITH e AS (
         INSERT INTO events (user_id, title, description, location, start_time, end_time, all_day, color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
       ) ${WITH_OWNER}`,
      [
        userId,
        data.title,
        data.description ?? null,
        data.location ?? null,
        data.startTime,
        data.endTime,
        data.allDay ?? false,
        data.color ?? '#4285f4',
      ]
    );
    return mapRow(rows[0]);
  }

  async update(id: string, data: Required<NewCalendarEvent>, expectedUpdatedAt?: string): Promise<CalendarEvent | null> {
    // Клиент знает updated_at с точностью до миллисекунд, а в БД хранятся микросекунды
    const { rows } = await pool.query(
      `WITH e AS (
         UPDATE events SET title=$1, description=$2, location=$3, start_time=$4, end_time=$5,
           all_day=$6, color=$7, updated_at=now()
         WHERE id=$8 AND ($9::timestamptz IS NULL OR date_trunc('milliseconds', updated_at) = $9::timestamptz)
         RETURNING *
       ) ${WITH_OWNER}`,
      [data.title, data.description, data.location, data.startTime, data.endTime, data.allDay, data.color, id, expectedUpdatedAt ?? null]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }
}
