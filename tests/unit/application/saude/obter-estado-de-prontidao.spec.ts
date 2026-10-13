import { describe, expect, it, vi } from 'vitest';
import { ObterEstadoDeProntidao } from '../../../../src/application/saude/obter-estado-de-prontidao';

describe('ObterEstadoDeProntidao', () => {
  it('retorna pronto quando o banco de dados está disponível', async () => {
    const verificadorSaudeBancoDados = {
      estaPronto: vi.fn().mockResolvedValue(true),
    };
    const casoDeUso = new ObterEstadoDeProntidao(
      verificadorSaudeBancoDados,
    );

    await expect(casoDeUso.executar()).resolves.toEqual({ status: 'ready' });
  });

  it('retorna não pronto quando o banco de dados está indisponível', async () => {
    const verificadorSaudeBancoDados = {
      estaPronto: vi.fn().mockResolvedValue(false),
    };
    const casoDeUso = new ObterEstadoDeProntidao(
      verificadorSaudeBancoDados,
    );

    await expect(casoDeUso.executar()).resolves.toEqual({
      status: 'not_ready',
    });
  });
});
