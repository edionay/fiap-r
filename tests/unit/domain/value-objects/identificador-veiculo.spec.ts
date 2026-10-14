import { describe, expect, it } from 'vitest';
import { ErroDominio } from '../../../../src/domain/errors/erro-dominio';
import { IdentificadorVeiculo } from '../../../../src/domain/value-objects/identificador-veiculo';

describe('IdentificadorVeiculo', () => {
  it('cria e normaliza um identificador UUID', () => {
    const identificador = IdentificadorVeiculo.criar(
      ' 550E8400-E29B-41D4-A716-446655440000 ',
    );

    expect(identificador.valor).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it.each(['', 'identificador', '00000000-0000-0000-0000-000000000000'])(
    'rejeita um identificador inválido: %s',
    (valor) => {
      expect(() => IdentificadorVeiculo.criar(valor)).toThrow(
        expect.objectContaining<Partial<ErroDominio>>({
          codigo: 'IDENTIFICADOR_VEICULO_INVALIDO',
        }),
      );
    },
  );

  it('compara identificadores pelo valor', () => {
    const primeiro = IdentificadorVeiculo.criar(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    const segundo = IdentificadorVeiculo.criar(
      '550e8400-e29b-41d4-a716-446655440000',
    );

    expect(primeiro.igualA(segundo)).toBe(true);
  });
});
