import { AuthUser } from '../types/User';
import { json, refreshAccessToken, request, setAccessToken } from './http';

export const authApi = {
  register: (email: string, password: string) =>
    request<AuthUser>('/auth/register', json('POST', { email, password })),

  async login(email: string, password: string): Promise<AuthUser> {
    const data = await request<{ accessToken: string; user: AuthUser }>('/auth/login', json('POST', { email, password }));
    setAccessToken(data.accessToken);
    return data.user;
  },

  /** Восстанавливает сессию после перезагрузки страницы; null — не залогинен */
  async restore(): Promise<AuthUser | null> {
    if (!(await refreshAccessToken())) return null;
    return (await request<{ user: AuthUser }>('/auth/me')).user;
  },

  async logout(): Promise<void> {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
    }
  },

  forgotPassword: (email: string) => request<void>('/auth/forgot-password', json('POST', { email })),

  resetPassword: (token: string, password: string) =>
    request<void>('/auth/reset-password', json('POST', { token, password })),
};
