import { describe, expect, it } from 'vitest';
import { GeradorIdentificadoresUuid } from '../../../../src/adapters/outbound/gerador-identificadores-uuid';
import { IdentificadorVeiculo } from '../../../../src/domain/identificador-veiculo';

describe('GeradorIdentificadoresUuid', () => {
  it('gera identificadores UUID válidos e distintos', () => {
    const gerador = new GeradorIdentificadoresUuid();

    const primeiro = gerador.gerar();
    const segundo = gerador.gerar();

    expect(() => IdentificadorVeiculo.criar(primeiro)).not.toThrow();
    expect(() => IdentificadorVeiculo.criar(segundo)).not.toThrow();
    expect(primeiro).not.toBe(segundo);
  });
});
