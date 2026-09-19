import { config } from 'dotenv';
import path from 'path';

// Load .env.test before anything else reads process.env (Prisma client, lib/auth, lib/env, etc.)
config({ path: path.resolve(__dirname, '../.env.test') });
