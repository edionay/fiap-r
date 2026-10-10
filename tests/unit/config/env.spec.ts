import { describe, expect, it } from 'vitest';
import { obterPorta } from '../../../src/config/env';

describe('obterPorta', () => {
  it('retorna a porta padrão quando o valor não é informado', () => {
    expect(obterPorta(undefined)).toBe(3000);
  });

  it('retorna a porta configurada quando o valor é válido', () => {
    expect(obterPorta('8080')).toBe(8080);
  });

  it.each(['0', '65536', '3000.5', 'inválida'])(
    'rejeita uma porta inválida: %s',
    (valor) => {
      expect(() => obterPorta(valor)).toThrow(
        'PORT deve ser um número inteiro entre 1 e 65535.',
      );
    },
  );
});
