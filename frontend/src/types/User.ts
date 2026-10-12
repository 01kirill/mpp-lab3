export type Role = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface Session {
  id: string;
  userId: string;
  userAgent: string | null;
  ip: string | null;
  expiresAt: string;
  createdAt: string;
  email?: string;
}