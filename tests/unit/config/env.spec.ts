import { describe, expect, it } from 'vitest';
import { getPort } from '../../../src/config/env';

describe('getPort', () => {
  it('returns the default port when the value is absent', () => {
    expect(getPort(undefined)).toBe(3000);
  });

  it('returns the configured port when it is valid', () => {
    expect(getPort('8080')).toBe(8080);
  });

  it.each(['0', '65536', '3000.5', 'invalid'])(
    'rejects an invalid port: %s',
    (value) => {
      expect(() => getPort(value)).toThrow(
        'PORT must be an integer between 1 and 65535.',
      );
    },
  );
});
