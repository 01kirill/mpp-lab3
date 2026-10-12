import { pool } from '../database/db';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { Attachment, NewAttachment } from '../../domain/entities/Attachment';

function mapRow(row: any): Attachment {
  return {
    id: row.id,
    eventId: row.event_id,
    originalName: row.original_name,
    storedName: row.stored_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    uploadedAt: row.uploaded_at.toISOString(),
  };
}

export class PostgresAttachmentRepository implements IAttachmentRepository {
  async findByEventId(eventId: string): Promise<Attachment[]> {
    const { rows } = await pool.query(
      `SELECT * FROM attachments WHERE event_id = $1 ORDER BY uploaded_at ASC`,
      [eventId]
    );
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Attachment | null> {
    const { rows } = await pool.query(`SELECT * FROM attachments WHERE id = $1`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: NewAttachment): Promise<Attachment> {
    const { rows } = await pool.query(
      `INSERT INTO attachments (event_id, original_name, stored_name, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.eventId, data.originalName, data.storedName, data.mimeType, data.sizeBytes]
    );
    return mapRow(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(`DELETE FROM attachments WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }
}