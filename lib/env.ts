function requireEnv(name: string, minLength = 1): string {
  const value = process.env[name];
  if (!value || value.trim().length < minLength) {
    throw new Error(
      `Missing or invalid required environment variable: ${name}. ` +
      `Check your .env file (see .env.example).`
    );
  }
  return value;
}

export function validateEnv(): void {
  requireEnv('DATABASE_URL', 10);
  requireEnv('JWT_SECRET', 32);

  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-min-32-chars-long!' && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is still set to the placeholder default. Set a unique secret before deploying to production.');
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set — AI report generation will run in simulator/fallback mode.');
  }
}
