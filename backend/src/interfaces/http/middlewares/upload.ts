import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { RemoveFile } from '../../../application/services/FileStorage';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Имя на диске без расширения: файлы отдаются только через /download как вложение, но так надёжнее
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, _file, cb) => cb(null, randomUUID()),
});

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

/** multer 1.x декодирует имя файла как latin1 — возвращаем UTF-8 (кириллица) */
export function decodeOriginalName(name: string): string {
  return Buffer.from(name, 'latin1').toString('utf8');
}

export const removeUploadedFile: RemoveFile = async (storedName) => {
  await fs.promises.rm(path.join(UPLOAD_DIR, path.basename(storedName)), { force: true });
};

export { UPLOAD_DIR };
