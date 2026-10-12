import { Role, User, Session } from '../types/User';
import { json, request } from './http';

export const usersApi = {
  list: () => request<User[]>('/users'),
  changeRole: (id: string, role: Role) => request<User>(`/users/${id}/role`, json('PATCH', { role })),
  setActive: (id: string, isActive: boolean) => request<User>(`/users/${id}/active`, json('PATCH', { isActive })),
  listSessions: () => request<Session[]>('/users/sessions'),
  revokeSession: (id: string) => request<void>(`/users/sessions/${id}`, { method: 'DELETE' }),
};
