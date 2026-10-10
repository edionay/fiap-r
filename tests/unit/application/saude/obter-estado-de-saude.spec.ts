import { describe, expect, it } from 'vitest';
import { obterEstadoDeSaude } from '../../../../src/application/saude/obter-estado-de-saude';

describe('obterEstadoDeSaude', () => {
  it('retorna o estado saudável', () => {
    expect(obterEstadoDeSaude()).toEqual({ status: 'ok' });
  });
});
