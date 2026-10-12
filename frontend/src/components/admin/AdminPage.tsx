import { useEffect, useState } from 'react';
import { Role, User, Session } from '../../types/User';
import { usersApi } from '../../api/usersApi';

const ROLES: Role[] = ['admin', 'editor', 'viewer'];

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'sessions'>('users');

  const loadUsers = async () => {
    try { setUsers(await usersApi.list()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const loadSessions = async () => {
    try { setSessions(await usersApi.listSessions()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); }
  };

  // Данные вкладки перечитываются при каждом её открытии: например, блокировка пользователя отзывает его сессии
  useEffect(() => {
    setError(null);
    if (tab === 'users') loadUsers();
    else loadSessions();
  }, [tab]);

  const changeRole = async (id: string, role: Role) => {
    try {
      const updated = await usersApi.changeRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const updated = await usersApi.setActive(id, isActive);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const revokeSession = async (id: string) => {
    try {
      await usersApi.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
      loadSessions();
    }
  };

  return (
    <div className="app">
      <h1>Админ-панель</h1>
      {error && <div className="alert alert--error">{error}</div>}

      <div className="admin-tabs">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Пользователи</button>
        <button className={tab === 'sessions' ? 'active' : ''} onClick={() => setTab('sessions')}>Активные сессии</button>
      </div>

      {tab === 'users' && (
        <table className="admin-table">
          <thead>
            <tr><th>Email</th><th>Роль</th><th>Активен</th><th>Создан</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value as Role)}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <input type="checkbox" checked={u.isActive} onChange={(e) => toggleActive(u.id, e.target.checked)} />
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'sessions' && (
        <table className="admin-table">
          <thead>
            <tr><th>Email</th><th>IP</th><th>User-Agent</th><th>Истекает</th><th></th></tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td>{s.ip || '—'}</td>
                <td className="muted">{s.userAgent?.slice(0, 60) || '—'}</td>
                <td>{new Date(s.expiresAt).toLocaleString()}</td>
                <td>
                  <button className="btn btn--danger btn--mini" onClick={() => revokeSession(s.id)}>Отозвать</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}