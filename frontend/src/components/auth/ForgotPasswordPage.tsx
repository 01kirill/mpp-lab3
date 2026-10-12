import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';

// Задаётся только в dev-сборке (docker-compose), в production ссылки на MailHog нет
const MAILHOG_URL = import.meta.env.VITE_MAILHOG_URL;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Восстановление пароля</h1>
        {error && <div className="alert alert--error">{error}</div>}
        {sent ? (
          <>
            <div className="alert alert--success">
              Если email зарегистрирован, письмо отправлено.
            </div>
            {MAILHOG_URL && (
              <p className="muted" style={{ textAlign: 'center', fontSize: 13 }}>
                В dev-режиме все письма попадают в MailHog —
                <br />
                <a href={MAILHOG_URL} target="_blank" rel="noopener noreferrer">
                  открыть MailHog →
                </a>
              </p>
            )}
          </>
        ) : (
          <>
            <p className="muted">Введите email — мы отправим ссылку для сброса.</p>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить ссылку'}
            </button>
          </>
        )}
        <div className="auth-links">
          <Link to="/login">Назад ко входу</Link>
        </div>
      </form>
    </div>
  );
}