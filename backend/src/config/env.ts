/**
 * Centralized environment configuration.
 *
 * Reads process.env once and exposes a typed, validated config object so the
 * rest of the app never touches process.env directly.
 */

function readEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: Number(readEnv('PORT', '4000')),
  corsOrigin: readEnv('CORS_ORIGIN', 'http://localhost:5173'),
  jwtSecret: readEnv('JWT_SECRET', 'dev-only-secret-change-me'),
  jwtExpiresIn: readEnv('JWT_EXPIRES_IN', '7d'),
} as const;
