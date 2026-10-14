import { describe, expect, it } from 'vitest';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { ErroDominio } from '../../../src/domain/erro-dominio';

describe('AnoFabricacao', () => {
  it('aceita o próximo ano civil', () => {
    const ano = AnoFabricacao.criar(2027, 2026);

    expect(ano.valor).toBe(2027);
  });

  it.each([1885, 2028, 2026.5])(
    'rejeita um ano de fabricação inválido: %s',
    (valor) => {
      expect(() => AnoFabricacao.criar(valor, 2026)).toThrow(
        expect.objectContaining<Partial<ErroDominio>>({
          codigo: 'ANO_FABRICACAO_INVALIDO',
        }),
      );
    },
  );

  it('compara anos pelo valor', () => {
    const primeiro = AnoFabricacao.criar(2025, 2026);
    const segundo = AnoFabricacao.criar(2025, 2026);

    expect(primeiro.igualA(segundo)).toBe(true);
  });
});
