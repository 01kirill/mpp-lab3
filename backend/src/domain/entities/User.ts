export type Role = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface Session {
  id: string;
  userId: string;
  userAgent: string | null;
  ip: string | null;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface PasswordReset {
  id: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

/** Тот, кто выполняет действие: берётся из актуальных данных сессии */
export interface Actor {
  id: string;
  role: Role;
}
