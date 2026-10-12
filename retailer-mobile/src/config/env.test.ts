import { resolveApiBaseUrl } from './env';

describe('resolveApiBaseUrl', () => {
  it('uses the configured value without a trailing slash', () => {
    expect(resolveApiBaseUrl('http://192.168.1.20:3000/')).toBe('http://192.168.1.20:3000');
  });
  it('falls back to a local default when unset or blank', () => {
    expect(resolveApiBaseUrl(undefined)).toMatch(/^http:\/\/(10\.0\.2\.2|localhost):3000$/);
    expect(resolveApiBaseUrl('  ')).toMatch(/:3000$/);
  });
});
