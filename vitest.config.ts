import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    testTimeout: 25000, // scans now render via a real headless browser, not a plain fetch — slower
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true } // integration tests share one Postgres test DB — avoid concurrent writers
    }
  }
});
