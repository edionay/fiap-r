import { describe, expect, it } from 'vitest';
import { Cpf } from '../../../src/domain/cpf';
import { ErroDominio } from '../../../src/domain/erro-dominio';

describe('Cpf', () => {
  it('cria um CPF válido com 11 dígitos', () => {
    const cpf = Cpf.criar(' 52998224725 ');

    expect(cpf.valor).toBe('52998224725');
  });

  it.each([
    '',
    '529.982.247-25',
    '52998224724',
    '11111111111',
    '1234567890',
  ])('rejeita um CPF inválido: %s', (valor) => {
    expect(() => Cpf.criar(valor)).toThrow(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'CPF_INVALIDO',
      }),
    );
  });
});
