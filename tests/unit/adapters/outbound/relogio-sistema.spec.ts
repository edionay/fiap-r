import { describe, expect, it, vi } from 'vitest';
import { RelogioSistema } from '../../../../src/adapters/outbound/relogio-sistema';

describe('RelogioSistema', () => {
  it('informa a data e hora atual', () => {
    const instante = new Date('2026-10-14T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(instante);

    const relogio = new RelogioSistema();

    expect(relogio.agora()).toEqual(instante);

    vi.useRealTimers();
  });
});
