import { describe, expect, it } from 'vitest';
import { ErroDominio } from '../../../../src/domain/errors/erro-dominio';
import { Preco } from '../../../../src/domain/value-objects/preco';

describe('Preco', () => {
  it('cria um preço representado em centavos', () => {
    const preco = Preco.criarEmCentavos(1_234_567);

    expect(preco.centavos).toBe(1_234_567);
  });

  it.each([0, -1, 10.5, Number.NaN, 1_000_000_000_000])(
    'rejeita um preço inválido: %s',
    (centavos) => {
      expect(() => Preco.criarEmCentavos(centavos)).toThrow(
        expect.objectContaining<Partial<ErroDominio>>({
          codigo: 'PRECO_INVALIDO',
        }),
      );
    },
  );

  it('compara preços pelo valor em centavos', () => {
    const primeiro = Preco.criarEmCentavos(100_00);
    const segundo = Preco.criarEmCentavos(100_00);

    expect(primeiro.igualA(segundo)).toBe(true);
  });
});
