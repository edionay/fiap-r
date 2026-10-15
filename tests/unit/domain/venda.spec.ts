import { describe, expect, it } from 'vitest';
import { Cpf } from '../../../src/domain/cpf';
import { ErroDominio } from '../../../src/domain/erro-dominio';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Venda } from '../../../src/domain/venda';

const IDENTIFICADOR_VENDA = '660e8400-e29b-41d4-a716-446655440000';
const VEICULO_ID = IdentificadorVeiculo.criar(
  '550e8400-e29b-41d4-a716-446655440000',
);
const CPF_COMPRADOR = Cpf.criar('52998224725');
const DATA_VENDA = new Date('2026-10-15T14:30:00.000Z');

function registrarVenda(
  sobrescritas: Partial<Parameters<typeof Venda.registrar>[0]> = {},
) {
  return Venda.registrar({
    identificador: IDENTIFICADOR_VENDA,
    veiculoId: VEICULO_ID,
    cpfComprador: CPF_COMPRADOR,
    vendidoEm: DATA_VENDA,
    ...sobrescritas,
  });
}

describe('Venda', () => {
  it('registra os dados mínimos da venda', () => {
    const venda = registrarVenda();

    expect(venda.identificador).toBe(IDENTIFICADOR_VENDA);
    expect(venda.veiculoId).toBe(VEICULO_ID);
    expect(venda.cpfComprador).toBe(CPF_COMPRADOR);
    expect(venda.vendidoEm).toEqual(DATA_VENDA);
  });

  it('protege as datas contra alteração externa', () => {
    const vendidoEm = new Date(DATA_VENDA);
    const venda = registrarVenda({ vendidoEm });

    vendidoEm.setUTCFullYear(2030);
    venda.vendidoEm.setUTCFullYear(2031);

    expect(venda.vendidoEm).toEqual(DATA_VENDA);
  });

  it('rejeita uma data de venda inválida', () => {
    expect(() =>
      registrarVenda({ vendidoEm: new Date('inválida') }),
    ).toThrow(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'DATA_VENDA_INVALIDA',
      }),
    );
  });
});
