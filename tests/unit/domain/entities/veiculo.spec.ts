import { describe, expect, it } from 'vitest';
import { SituacaoVeiculo } from '../../../../src/domain/entities/situacao-veiculo';
import { Veiculo } from '../../../../src/domain/entities/veiculo';
import { ErroDominio } from '../../../../src/domain/errors/erro-dominio';
import { TipoEventoVeiculo } from '../../../../src/domain/events/veiculo-cadastrado';
import { AnoFabricacao } from '../../../../src/domain/value-objects/ano-fabricacao';
import { IdentificadorVeiculo } from '../../../../src/domain/value-objects/identificador-veiculo';
import { Preco } from '../../../../src/domain/value-objects/preco';

const IDENTIFICADOR = IdentificadorVeiculo.criar(
  '550e8400-e29b-41d4-a716-446655440000',
);
const ANO_FABRICACAO = AnoFabricacao.criar(2025, 2026);
const PRECO = Preco.criarEmCentavos(7_500_000);
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');

function cadastrarVeiculo(
  sobrescritas: Partial<Parameters<typeof Veiculo.cadastrar>[0]> = {},
) {
  return Veiculo.cadastrar({
    identificador: IDENTIFICADOR,
    marca: ' Honda ',
    modelo: ' Civic ',
    anoFabricacao: ANO_FABRICACAO,
    cor: ' Preto ',
    precoAnunciado: PRECO,
    cadastradoEm: DATA_CADASTRO,
    ...sobrescritas,
  });
}

describe('Veiculo', () => {
  it('cadastra um veículo disponível com os dados normalizados', () => {
    const { veiculo } = cadastrarVeiculo();

    expect(veiculo.identificador).toBe(IDENTIFICADOR);
    expect(veiculo.marca).toBe('Honda');
    expect(veiculo.modelo).toBe('Civic');
    expect(veiculo.anoFabricacao).toBe(ANO_FABRICACAO);
    expect(veiculo.cor).toBe('Preto');
    expect(veiculo.precoAnunciado).toBe(PRECO);
    expect(veiculo.situacao).toBe(SituacaoVeiculo.DISPONIVEL);
    expect(veiculo.criadoEm).toEqual(DATA_CADASTRO);
    expect(veiculo.atualizadoEm).toEqual(DATA_CADASTRO);
  });

  it.each([
    ['marca', { marca: '   ' }, 'MARCA_OBRIGATORIA'],
    ['modelo', { modelo: '' }, 'MODELO_OBRIGATORIO'],
    ['cor', { cor: ' ' }, 'COR_OBRIGATORIA'],
  ] as const)(
    'rejeita %s sem conteúdo',
    (_campo, sobrescritas, codigo) => {
      expect(() => cadastrarVeiculo(sobrescritas)).toThrow(
        expect.objectContaining<Partial<ErroDominio>>({ codigo }),
      );
    },
  );

  it('rejeita uma data de cadastro inválida', () => {
    expect(() =>
      cadastrarVeiculo({ cadastradoEm: new Date('inválida') }),
    ).toThrow(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'DATA_CADASTRO_INVALIDA',
      }),
    );
  });

  it('protege as datas internas contra alteração externa', () => {
    const dataInformada = new Date(DATA_CADASTRO);
    const { veiculo } = cadastrarVeiculo({ cadastradoEm: dataInformada });

    dataInformada.setUTCFullYear(2030);
    const dataRetornada = veiculo.criadoEm;
    dataRetornada.setUTCFullYear(2031);

    expect(veiculo.criadoEm).toEqual(DATA_CADASTRO);
    expect(veiculo.atualizadoEm).toEqual(DATA_CADASTRO);
  });

  it('produz o evento imutável de veículo cadastrado', () => {
    const { evento } = cadastrarVeiculo();

    expect(evento).toEqual({
      tipo: TipoEventoVeiculo.CADASTRADO,
      veiculoId: IDENTIFICADOR.valor,
      dados: {
        marca: 'Honda',
        modelo: 'Civic',
        anoFabricacao: 2025,
        cor: 'Preto',
        precoAnunciadoCentavos: 7_500_000,
        situacao: SituacaoVeiculo.DISPONIVEL,
      },
      ocorridoEm: '2026-10-14T12:00:00.000Z',
    });
    expect(Object.isFrozen(evento)).toBe(true);
    expect(Object.isFrozen(evento.dados)).toBe(true);
  });
});
