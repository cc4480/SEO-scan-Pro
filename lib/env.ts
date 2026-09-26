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

// Placeholder secrets that ship in .env.example / the docs and have therefore been used by
// real deployments. They are public knowledge, so treating them as configured is unsafe.
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  'your-super-secret-jwt-key-min-32-chars-long!',
  'your-super-secret-jwt-key-that-must-be-at-least-32-characters-long-for-security!',
  'your-secret-key-min-32-chars',
  'a-random-string-32-chars-min'
]);

export function validateEnv(): void {
  requireEnv('DATABASE_URL', 10);
  const jwtSecret = requireEnv('JWT_SECRET', 32);

  // Home-rolled secrets like "secret123" or a documented placeholder are the whole ballgame
  // for this app: HS256 tokens signed with a guessable secret let an attacker impersonate any
  // account. Refuse to boot rather than warn, and do it regardless of NODE_ENV — the previous
  // version only fired under NODE_ENV=production, which nothing ever set.
  if (KNOWN_PLACEHOLDER_SECRETS.has(jwtSecret.trim())) {
    throw new Error(
      'JWT_SECRET is still a placeholder value from the documentation and is therefore public. ' +
        'Generate a unique secret, e.g. node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
    );
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('DEEPSEEK_API_KEY not set — AI report generation will run in simulator/fallback mode.');
  }
}
