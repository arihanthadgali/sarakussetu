import { describe, expect, it } from 'vitest';

import { createApp } from './app.js';

describe('application bootstrap', () => {
  it('creates an Express app with implementation details disabled', () => {
    const app = createApp();

    expect(app.get('x-powered-by')).toBe(false);
  });
});
