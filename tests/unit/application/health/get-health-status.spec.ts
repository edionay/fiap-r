import { describe, expect, it } from 'vitest';
import { getHealthStatus } from '../../../../src/application/health/get-health-status';

describe('getHealthStatus', () => {
  it('returns the healthy status', () => {
    expect(getHealthStatus()).toEqual({ status: 'ok' });
  });
});
