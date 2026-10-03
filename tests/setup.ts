import { config } from 'dotenv';
import path from 'path';

// Load .env.test before anything else reads process.env (Prisma client, lib/auth, lib/env, etc.)
config({ path: path.resolve(__dirname, '../.env.test') });

// Unit tests need a signing secret but no database. Provide a throwaway one when .env.test is absent
// (a fresh checkout or CI) so `npm test` does not fail on JWT_SECRET. Integration tests still need
// DATABASE_URL from .env.test (see .env.test.example).
process.env.JWT_SECRET ||= 'test-only-secret-not-used-anywhere-else-0123456789abcdef';
