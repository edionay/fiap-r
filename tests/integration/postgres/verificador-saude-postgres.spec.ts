import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VerificadorSaudePostgres } from '../../../src/adapters/outbound/postgres/verificador-saude-postgres';

const urlBancoDados = process.env.TEST_DATABASE_URL ?? '';

describe.skipIf(urlBancoDados === '')('Integração com PostgreSQL', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({ connectionString: urlBancoDados });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('informa que o banco de dados está pronto', async () => {
    const verificadorSaude = new VerificadorSaudePostgres(pool);

    await expect(verificadorSaude.estaPronto()).resolves.toBe(true);
  });

  it('contém as tabelas iniciais do domínio', async () => {
    const resultado = await pool.query<{
      veiculos: string | null;
      vendas: string | null;
      historicoVeiculos: string | null;
    }>(`
      SELECT
        to_regclass('public.veiculos') AS veiculos,
        to_regclass('public.vendas') AS vendas,
        to_regclass('public.historico_veiculos') AS "historicoVeiculos"
    `);

    expect(resultado.rows[0]).toEqual({
      veiculos: 'veiculos',
      vendas: 'vendas',
      historicoVeiculos: 'historico_veiculos',
    });
  });
});
