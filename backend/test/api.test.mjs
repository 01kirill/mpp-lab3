// Интеграционные тесты API. Нужен запущенный backend с TRUST_PROXY=1 (тесты меняют IP через
// X-Forwarded-For, чтобы не упираться в rate limit) и сидированным админом.
//   API_URL=http://localhost:4000 ADMIN_EMAIL=... ADMIN_PASSWORD=... MAILHOG_URL=http://localhost:8025 npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

const ROOT = process.env.API_URL || 'http://localhost:4000';
const API = `${ROOT}/api`;
const ADMIN = { email: process.env.ADMIN_EMAIL || 'admin@example.com', password: process.env.ADMIN_PASSWORD || 'admin12345' };
const MAILHOG = process.env.MAILHOG_URL;
const run = Math.random().toString(36).slice(2, 8);
let ipSeq = 0;
const freshIp = () => `10.${run.charCodeAt(0) % 250}.${Math.floor(ipSeq / 250)}.${ipSeq++ % 250}`;

async function req(method, path, { token, body, cookie, form, ip = freshIp() } = {}) {
  const headers = { 'X-Forwarded-For': ip };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  let payload = form;
  if (body !== undefined && !form) {
    headers['Content-Type'] = 'application/json';
    payload = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(API + path, { method, headers, body: payload });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, cookie: res.headers.get('set-cookie')?.split(';')[0], headers: res.headers };
}

const login = async (email, password = 'password123') => {
  const r = await req('POST', '/auth/login', { body: { email, password } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return { token: r.json.accessToken, cookie: r.cookie, user: r.json.user };
};
const newUser = async (name) => {
  const email = `${name}_${run}@test.io`;
  assert.equal((await req('POST', '/auth/register', { body: { email, password: 'password123' } })).status, 201);
  return login(email);
};
const fileForm = (name, content = 'hello', type = 'text/plain') => {
  const fd = new FormData();
  fd.append('file', new Blob([content], { type }), name);
  return fd;
};
const ev = (title, extra = {}) => ({ title, startTime: '2026-10-12T10:00:00.000Z', endTime: '2026-10-12T11:00:00.000Z', ...extra });

const admin = await login(ADMIN.email, ADMIN.password);
const alice = await newUser('alice');
const bob = await newUser('bob');
const aliceEvent = (await req('POST', '/events', { token: alice.token, body: ev('Alice secret') })).json;

test('/auth/me возвращает email', async () => {
  const r = await req('GET', '/auth/me', { token: alice.token });
  assert.deepEqual(r.json.user, alice.user);
});

test('editor не видит и не трогает чужие события', async () => {
  assert.equal((await req('GET', `/events/${aliceEvent.id}`, { token: bob.token })).status, 404);
  assert.equal((await req('PUT', `/events/${aliceEvent.id}`, { token: bob.token, body: { title: 'x' } })).status, 404);
  assert.equal((await req('GET', `/events/${aliceEvent.id}/attachments`, { token: bob.token })).status, 404);
  assert.equal((await req('POST', `/events/${aliceEvent.id}/attachments`, { token: bob.token, form: fileForm('a.txt') })).status, 404);
  const list = (await req('GET', '/events', { token: bob.token })).json;
  assert.ok(!list.some((e) => e.id === aliceEvent.id));
});

test('вложения: только с авторизацией, кириллица, нет публичного /uploads', async () => {
  const up = await req('POST', `/events/${aliceEvent.id}/attachments`, { token: alice.token, form: fileForm('отчёт.html', '<script>1</script>', 'text/html') });
  assert.equal(up.status, 201);
  assert.equal(up.json.originalName, 'отчёт.html');
  assert.equal((await fetch(`${ROOT}/uploads/${up.json.storedName}`)).status, 404);
  assert.equal((await req('GET', `/attachments/${up.json.id}/download`)).status, 401);
  assert.equal((await req('DELETE', `/attachments/${up.json.id}`)).status, 401);
  assert.equal((await req('GET', `/attachments/${up.json.id}/download`, { token: bob.token })).status, 404);
  assert.equal((await req('DELETE', `/attachments/${up.json.id}`, { token: bob.token })).status, 404);
  const dl = await req('GET', `/attachments/${up.json.id}/download`, { token: alice.token });
  assert.equal(dl.status, 200);
  assert.match(dl.headers.get('content-disposition'), /^attachment/);
  assert.equal((await req('DELETE', `/attachments/${up.json.id}`, { token: alice.token })).status, 204);
});

test('ошибки ввода дают 4xx, а не 500', async () => {
  const t = alice.token;
  assert.equal((await req('GET', '/events/not-a-uuid', { token: t })).status, 404);
  assert.equal((await req('GET', '/events?rangeStart=foo&rangeEnd=bar', { token: t })).status, 422);
  assert.equal((await req('GET', '/events?rangeStart=2026-10-01T00:00:00Z', { token: t })).status, 422);
  assert.equal((await req('POST', '/events', { token: t, body: '{bad' })).status, 400);
  const missing = '00000000-0000-0000-0000-000000000000';
  assert.equal((await req('POST', `/events/${missing}/attachments`, { token: t, form: fileForm('a.txt') })).status, 404);
  const big = await req('POST', `/events/${aliceEvent.id}/attachments`, { token: t, form: fileForm('big.bin', new Uint8Array(21 * 1024 * 1024)) });
  assert.equal(big.status, 413);
  assert.equal((await req('DELETE', `/users/sessions/${missing}`, { token: admin.token })).status, 404);
});

test('параллельная регистрация одного email: 201 и 409, без 500', async () => {
  const email = `race_${run}@test.io`;
  const codes = (await Promise.all([1, 2, 3].map(() => req('POST', '/auth/register', { body: { email, password: 'password123' } })))).map((r) => r.status);
  assert.deepEqual(codes.sort(), [201, 409, 409]);
});

test('all-day событие хранит плавающую UTC-дату и не сдвигается', async () => {
  const body = ev('All day', { allDay: true, startTime: '2026-10-12T00:00:00.000Z', endTime: '2026-10-13T23:59:59.999Z' });
  const created = (await req('POST', '/events', { token: alice.token, body })).json;
  assert.equal(created.startTime, body.startTime);
  assert.equal(created.endTime, body.endTime);
  const updated = (await req('PUT', `/events/${created.id}`, { token: alice.token, body: { title: 'again' } })).json;
  assert.equal(updated.startTime, body.startTime);
  // «Локальные» границы (полночь Минска) больше не принимаются
  const local = ev('Local', { allDay: true, startTime: '2026-10-11T21:00:00.000Z', endTime: '2026-10-12T20:59:59.999Z' });
  assert.equal((await req('POST', '/events', { token: alice.token, body: local })).status, 422);
  // Включить all-day у события со временем нельзя, не передав даты
  const timed = (await req('POST', '/events', { token: alice.token, body: ev('Timed') })).json;
  assert.equal((await req('PUT', `/events/${timed.id}`, { token: alice.token, body: { allDay: true } })).status, 422);
});

test('viewer видит все события, но не может писать; смена роли действует сразу', async () => {
  const carol = await newUser('carol');
  assert.equal((await req('PATCH', `/users/${carol.user.id}/role`, { token: admin.token, body: { role: 'viewer' } })).status, 200);
  // тот же (старый) токен уже работает с новой ролью
  assert.equal((await req('POST', '/events', { token: carol.token, body: ev('x') })).status, 403);
  const list = (await req('GET', '/events', { token: carol.token })).json;
  assert.ok(list.some((e) => e.id === aliceEvent.id));
  assert.equal((await req('GET', `/events/${aliceEvent.id}`, { token: carol.token })).status, 200);
  assert.equal((await req('DELETE', `/events/${aliceEvent.id}`, { token: carol.token })).status, 403);
});

test('refresh: работает на нескольких устройствах и ротирует токен', async () => {
  const email = `${'bob'}_${run}@test.io`;
  const d1 = await login(email);
  const d2 = await login(email);
  const r1 = await req('POST', '/auth/refresh', { cookie: d1.cookie });
  const r2 = await req('POST', '/auth/refresh', { cookie: d2.cookie });
  assert.equal(r1.status, 200);
  assert.equal(r2.status, 200);
  assert.notEqual(r1.cookie, d1.cookie);
  assert.equal((await req('POST', '/auth/refresh', { cookie: d1.cookie })).status, 401, 'старый refresh-токен после ротации недействителен');
  assert.equal((await req('GET', '/auth/me', { token: r1.json.accessToken })).status, 200);
});

test('logout без access-токена отзывает сессию по cookie', async () => {
  const d = await login(`bob_${run}@test.io`);
  const r = await req('POST', '/auth/logout', { cookie: d.cookie });
  assert.equal(r.status, 204);
  assert.equal((await req('GET', '/auth/me', { token: d.token })).status, 401);
  assert.equal((await req('POST', '/auth/refresh', { cookie: d.cookie })).status, 401);
});

test('подбор пароля ограничен по email, даже с разных IP', async () => {
  const dave = await newUser('dave');
  const codes = [];
  for (let i = 0; i < 11; i++) {
    codes.push((await req('POST', '/auth/login', { body: { email: dave.user.email, password: 'wrong' } })).status);
  }
  assert.equal(codes.at(-1), 429);
});

test('удаление события удаляет и вложения', async () => {
  const e = (await req('POST', '/events', { token: alice.token, body: ev('with file') })).json;
  const a = (await req('POST', `/events/${e.id}/attachments`, { token: alice.token, form: fileForm('f.txt') })).json;
  assert.equal((await req('DELETE', `/events/${e.id}`, { token: alice.token })).status, 204);
  assert.equal((await req('GET', `/attachments/${a.id}/download`, { token: alice.token })).status, 404);
});

test('сброс пароля через MailHog', { skip: !MAILHOG && 'MAILHOG_URL не задан' }, async () => {
  const erin = await newUser('erin');
  assert.equal((await req('POST', '/auth/forgot-password', { body: { email: erin.user.email } })).status, 200);
  let token;
  for (let i = 0; i < 20 && !token; i++) {
    const msgs = await (await fetch(`${MAILHOG}/api/v2/search?kind=to&query=${encodeURIComponent(erin.user.email)}`)).json();
    const body = (msgs.items[0]?.Content.Body ?? '').replace(/=\r?\n/g, '').replace(/=3D/g, '=');
    token = body.match(/token=([a-f0-9]{64})/)?.[1];
    if (!token) await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(token, 'письмо не пришло');
  const resets = await Promise.all([1, 2].map(() => req('POST', '/auth/reset-password', { body: { token, password: 'newpass123' } })));
  assert.deepEqual(resets.map((r) => r.status).sort(), [200, 400]);
  assert.equal((await req('GET', '/auth/me', { token: erin.token })).status, 401, 'старые сессии отозваны');
  await login(erin.user.email, 'newpass123');
});

test('события содержат email автора', async () => {
  const fromAdmin = (await req('GET', `/events/${aliceEvent.id}`, { token: admin.token })).json;
  assert.equal(fromAdmin.ownerEmail, alice.user.email);
  const list = (await req('GET', '/events', { token: admin.token })).json;
  assert.equal(list.find((e) => e.id === aliceEvent.id).ownerEmail, alice.user.email);
});

test('параллельное редактирование: устаревший expectedUpdatedAt даёт 409', async () => {
  const e = (await req('POST', '/events', { token: alice.token, body: ev('conflict') })).json;
  const first = await req('PUT', `/events/${e.id}`, { token: alice.token, body: { title: 'first', expectedUpdatedAt: e.updatedAt } });
  assert.equal(first.status, 200);
  const stale = await req('PUT', `/events/${e.id}`, { token: admin.token, body: { title: 'stale', expectedUpdatedAt: e.updatedAt } });
  assert.equal(stale.status, 409);
  assert.equal(stale.json.code, 'EVENT_CONFLICT');
  const fresh = await req('PUT', `/events/${e.id}`, { token: admin.token, body: { title: 'fresh', expectedUpdatedAt: first.json.updatedAt } });
  assert.equal(fresh.status, 200);
  assert.equal(fresh.json.title, 'fresh');
});
