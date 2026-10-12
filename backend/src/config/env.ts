import dotenv from 'dotenv';
dotenv.config();

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || '';
if (jwtAccessSecret.length < 32) {
  throw new Error('JWT_ACCESS_SECRET не задан или короче 32 символов');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '5432', 10),
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || 'postgres',
  dbName: process.env.DB_NAME || 'calendar_db',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  // Включать только если backend стоит за реальным reverse-proxy (число хопов), иначе X-Forwarded-For подделывается
  trustProxy: parseInt(process.env.TRUST_PROXY || '0', 10),
  // Флаг Secure у refresh-cookie. Включён в production; выключать только при работе по http (docker-compose на localhost)
  cookieSecure: (process.env.COOKIE_SECURE ?? String(process.env.NODE_ENV === 'production')) === 'true',
  jwtAccessSecret,
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
  jwtRefreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS || 7),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  // Без ADMIN_PASSWORD администратор не создаётся
  adminPassword: process.env.ADMIN_PASSWORD || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || '',
  smtpHost: process.env.SMTP_HOST || 'localhost',
  smtpPort: parseInt(process.env.SMTP_PORT || '1025', 10),
  smtpFrom: process.env.SMTP_FROM || 'Calendar App <noreply@calendar.local>',
};
