import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ROUNDS = 10;
// Хеш случайной строки: сравнение с ним тратит столько же времени, сколько настоящая проверка
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), ROUNDS);

export class PasswordService {
  hash(password: string): Promise<string> {
    return bcrypt.hash(password, ROUNDS);
  }

  /** hash = null — пользователя нет; сравниваем с фиктивным хешем, чтобы время ответа не выдавало email */
  async compare(password: string, hash: string | null): Promise<boolean> {
    const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
    return ok && hash !== null;
  }
}
