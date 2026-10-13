import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/sarakusetu_test?schema=public',
      JWT_SECRET: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
    },
  },
});
