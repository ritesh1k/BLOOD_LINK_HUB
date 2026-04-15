import dotenv from 'dotenv';

dotenv.config();

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((v) => normalizeOrigin(v.trim()))
    .filter(Boolean);
}

function normalizeOrigin(origin) {
  return String(origin || '').trim().replace(/\/+$/, '');
}

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = Number(process.env.PORT) || 3000;
export const IS_PRODUCTION = NODE_ENV === 'production';
export const FRONTEND_BASE_URL = normalizeOrigin(process.env.FRONTEND_BASE_URL);

const DEFAULT_DEV_CORS = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:5502',
  'http://127.0.0.1:5502',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];
export const CORS_ORIGINS = parseList(process.env.CORS_ORIGIN);

export function getCorsOriginHandler() {
  const allowed = CORS_ORIGINS.length ? CORS_ORIGINS : DEFAULT_DEV_CORS;
  const allowedSet = new Set(allowed.map((origin) => normalizeOrigin(origin)));

  return function corsOrigin(origin, callback) {
    // Allow non-browser clients (curl/postman) with no Origin header.
    if (!origin) return callback(null, true);

    // Local file pages can send literal "null" as Origin.
    if (!IS_PRODUCTION && String(origin).toLowerCase() === 'null') {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedSet.has('*') || allowedSet.has(normalizedOrigin)) {
      return callback(null, true);
    }

    if (!IS_PRODUCTION && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  };
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length >= 16) return secret;

  if (IS_PRODUCTION) {
    throw new Error('JWT_SECRET must be set to at least 16 characters in production.');
  }

  return 'dev_secret';
}

export function validateRuntimeConfig() {
  const requiredDbVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = requiredDbVars.filter((key) => !process.env[key]);

  if (IS_PRODUCTION) {
    if (!process.env.DB_PASSWORD) missing.push('DB_PASSWORD');
    if (!process.env.CORS_ORIGIN) missing.push('CORS_ORIGIN');
  }

  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }

  // Ensure JWT secret rules are evaluated during startup.
  getJwtSecret();
}

export function getFrontendBaseUrl(req) {
  if (FRONTEND_BASE_URL) return FRONTEND_BASE_URL;

  const origin = normalizeOrigin(req?.headers?.origin);
  if (origin && /^https?:\/\//i.test(origin)) {
    return `${origin}/frontend`;
  }

  return 'http://127.0.0.1:5500/frontend';
}
