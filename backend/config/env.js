require('dotenv').config();

const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

module.exports = {
  PORT: parsePort(process.env.PORT, 5000),
  JWT_SECRET: process.env.JWT_SECRET ?? 'neap_super_secret_jwt_key_2026_hyperlocal',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? '12345678901234567890123456789012', // 32 chars for AES-256
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: parsePort(process.env.DB_PORT, 3306),
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_NAME: process.env.DB_NAME ?? 'neap_db'
};

