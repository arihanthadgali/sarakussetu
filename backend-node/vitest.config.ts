import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    env: {
      DATABASE_URL: 'mysql://test:test@localhost:3306/sarakusetu_test',
    },
  },
});
