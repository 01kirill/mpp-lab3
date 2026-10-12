export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

// Access-токен живёт только в памяти (не в localStorage — его не украдёт XSS).
// После перезагрузки страницы он восстанавливается через refresh-cookie.
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => { accessToken = token; };

let refreshing: Promise<boolean> | null = null;

// Вызывается, когда сессию восстановить не удалось (отозвана, истекла) — UI отправляет на /login
let sessionExpiredHandler = () => {};
export const onSessionExpired = (handler: () => void) => { sessionExpiredHandler = handler; };

/** Обновляет access-токен по httpOnly-cookie. Параллельные вызовы делят один запрос. */
export function refreshAccessToken(): Promise<boolean> {
  refreshing ??= fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      setAccessToken(res.ok ? (await res.json()).accessToken : null);
      return res.ok;
    })
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

/** fetch с Bearer-токеном; при 401 один раз обновляет токен и повторяет запрос */
export async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json');
  const res = await fetch(API_BASE + path, { ...init, headers, credentials: 'include' });
  if (res.status === 401 && retry && accessToken) {
    if (await refreshAccessToken()) return apiFetch(path, init, false);
    sessionExpiredHandler();
  }
  if (!res.ok) throw await toError(res);
  return res;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

async function toError(res: Response): Promise<ApiError> {
  const data = await res.json().catch(() => null);
  // 422 от zod: показываем сообщения по полям, а не только общее «Ошибка валидации»
  const fieldErrors = Object.values<string[]>(data?.details?.fieldErrors ?? {}).flat();
  const formErrors: string[] = data?.details?.formErrors ?? [];
  const extra = [...fieldErrors, ...formErrors];
  const message = data?.error || `Ошибка запроса: ${res.status}`;
  return new ApiError(extra.length ? `${message}: ${extra.join('; ')}` : message, res.status, data?.code);
}
