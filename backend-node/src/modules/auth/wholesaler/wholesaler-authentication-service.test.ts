import { describe, expect, it, vi } from 'vitest';

import {
  WholesalerAuthenticationService,
  type WholesalerVerificationOutcome,
} from './wholesaler-authentication-service.js';

describe('WholesalerAuthenticationService', () => {
  it('exports the expected verification outcome type', () => {
    const outcome: WholesalerVerificationOutcome = {
      result: 'VERIFIED',
      isNewWholesaler: true,
    };

    expect(outcome.result).toBe('VERIFIED');
    expect(outcome.isNewWholesaler).toBe(true);
  });

  it('can be instantiated with dependencies', () => {
    const database = {} as never;
    const codeGenerator = {
      generate: vi.fn(() => '123456'),
    };
    const hasher = {
      hash: vi.fn(),
      matches: vi.fn(),
    };
    const delivery = {
      deliver: vi.fn(),
    };

    const service = new WholesalerAuthenticationService(
      database,
      codeGenerator,
      hasher,
      delivery,
    );

    expect(service).toBeInstanceOf(WholesalerAuthenticationService);
  });
});
