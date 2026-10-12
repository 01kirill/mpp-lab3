import { createApp } from './app';
import { env } from './config/env';
import { pool, purgeExpiredAuthData, runMigrations, seedAdmin } from './infrastructure/database/db';
import { PasswordService } from './application/services/PasswordService';
import { appLogger } from './infrastructure/logging/logger';

const PURGE_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function waitForDb(retries = 15, delayMs = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (e) {
      console.log(`Waiting for database... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Could not connect to database');
}

async function bootstrap() {
  await waitForDb();
  await runMigrations();

  if (env.adminPassword) {
    const passwordService = new PasswordService();
    const result = await seedAdmin(env.adminEmail, () => passwordService.hash(env.adminPassword));
    if (result === 'admin.email_taken') {
      appLogger.warn('admin.seed.email_taken', { email: env.adminEmail });
    } else {
      appLogger.info(result, { email: env.adminEmail });
    }
  } else {
    appLogger.warn('admin.seed.skipped', { reason: 'ADMIN_PASSWORD не задан' });
  }

  const purge = () =>
    purgeExpiredAuthData()
      .then((n) => appLogger.info('auth.purge', n))
      .catch((e) => appLogger.error('auth.purge.failed', { error: e instanceof Error ? e.message : String(e) }));
  await purge();
  setInterval(purge, PURGE_INTERVAL_MS).unref();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

bootstrap().catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});
