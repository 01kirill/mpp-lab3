import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return setError('Токен отсутствует в ссылке');
    if (password.length < 8) return setError('Пароль должен быть не менее 8 символов');
    if (password !== password2) return setError('Пароли не совпадают');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сбросить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Новый пароль</h1>
        {error && <div className="alert alert--error">{error}</div>}
        <label>
          Новый пароль (минимум 8 символов)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
        </label>
        <label>
          Повторите пароль
          <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить пароль'}
        </button>
        <div className="auth-links">
          <Link to="/login">Назад ко входу</Link>
        </div>
      </form>
    </div>
  );
}