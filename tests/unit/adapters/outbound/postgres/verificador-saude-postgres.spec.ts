import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { VerificadorSaudePostgres } from '../../../../../src/adapters/outbound/postgres/verificador-saude-postgres';

describe('VerificadorSaudePostgres', () => {
  it('retorna verdadeiro quando a consulta é bem-sucedida', async () => {
    const consultar = vi.fn().mockResolvedValue({ rows: [{ resultado: 1 }] });
    const pool = {
      query: consultar,
    } as unknown as Pool;
    const verificadorSaude = new VerificadorSaudePostgres(pool);

    await expect(verificadorSaude.estaPronto()).resolves.toBe(true);
    expect(consultar).toHaveBeenCalledWith('SELECT 1');
  });

  it('retorna falso quando a consulta falha', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('falha na conexão')),
    } as unknown as Pool;
    const verificadorSaude = new VerificadorSaudePostgres(pool);

    await expect(verificadorSaude.estaPronto()).resolves.toBe(false);
  });
});
