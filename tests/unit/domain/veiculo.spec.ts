import { describe, expect, it } from 'vitest';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { ErroDominio } from '../../../src/domain/erro-dominio';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Preco } from '../../../src/domain/preco';
import { SituacaoVeiculo } from '../../../src/domain/situacao-veiculo';
import { Veiculo } from '../../../src/domain/veiculo';

const IDENTIFICADOR = IdentificadorVeiculo.criar(
  '550e8400-e29b-41d4-a716-446655440000',
);
const ANO_FABRICACAO = AnoFabricacao.criar(2025, 2026);
const PRECO = Preco.criarEmCentavos(7_500_000);
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');
const DATA_ATUALIZACAO = new Date('2026-10-15T14:30:00.000Z');

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

function reconstruirVeiculo(
  sobrescritas: Partial<Parameters<typeof Veiculo.reconstruir>[0]> = {},
) {
  return Veiculo.reconstruir({
    identificador: IDENTIFICADOR,
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: ANO_FABRICACAO,
    cor: 'Preto',
    precoAnunciado: PRECO,
    situacao: SituacaoVeiculo.DISPONIVEL,
    criadoEm: DATA_CADASTRO,
    atualizadoEm: DATA_CADASTRO,
    ...sobrescritas,
  });
}

describe('Veiculo', () => {
  it('cadastra um veículo disponível com os dados normalizados', () => {
    const veiculo = cadastrarVeiculo();

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
    const veiculo = cadastrarVeiculo({ cadastradoEm: dataInformada });

    dataInformada.setUTCFullYear(2030);
    const dataRetornada = veiculo.criadoEm;
    dataRetornada.setUTCFullYear(2031);

    expect(veiculo.criadoEm).toEqual(DATA_CADASTRO);
    expect(veiculo.atualizadoEm).toEqual(DATA_CADASTRO);
  });

  it('reconstrói um veículo persistido', () => {
    const veiculo = reconstruirVeiculo({
      situacao: SituacaoVeiculo.VENDIDO,
      atualizadoEm: DATA_ATUALIZACAO,
    });

    expect(veiculo.identificador).toBe(IDENTIFICADOR);
    expect(veiculo.situacao).toBe(SituacaoVeiculo.VENDIDO);
    expect(veiculo.criadoEm).toEqual(DATA_CADASTRO);
    expect(veiculo.atualizadoEm).toEqual(DATA_ATUALIZACAO);
  });

  it('rejeita a reconstrução com situação inválida', () => {
    expect(() => reconstruirVeiculo({ situacao: 'RESERVADO' })).toThrow(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'SITUACAO_VEICULO_INVALIDA',
      }),
    );
  });

  it('edita os dados informados e registra a data da alteração', () => {
    const veiculo = reconstruirVeiculo();
    const novoPreco = Preco.criarEmCentavos(8_000_000);

    const editado = veiculo.editar(
      {
        marca: ' Toyota ',
        modelo: 'Accord',
        anoFabricacao: AnoFabricacao.criar(2026, 2026),
        cor: 'Branco',
        precoAnunciado: novoPreco,
      },
      DATA_ATUALIZACAO,
    );

    expect(editado.marca).toBe('Toyota');
    expect(editado.modelo).toBe('Accord');
    expect(editado.anoFabricacao.valor).toBe(2026);
    expect(editado.cor).toBe('Branco');
    expect(editado.precoAnunciado).toBe(novoPreco);
    expect(editado.situacao).toBe(SituacaoVeiculo.DISPONIVEL);
    expect(editado.criadoEm).toEqual(DATA_CADASTRO);
    expect(editado.atualizadoEm).toEqual(DATA_ATUALIZACAO);
  });

  it('mantém os campos não informados durante a edição', () => {
    const veiculo = reconstruirVeiculo();

    const editado = veiculo.editar({ cor: 'Branco' }, DATA_ATUALIZACAO);

    expect(editado.marca).toBe('Honda');
    expect(editado.modelo).toBe('Civic');
    expect(editado.cor).toBe('Branco');
    expect(editado.precoAnunciado).toBe(PRECO);
  });

  it('rejeita uma data de atualização inválida', () => {
    const veiculo = reconstruirVeiculo();

    expect(() =>
      veiculo.editar({ cor: 'Branco' }, new Date('inválida')),
    ).toThrow(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'DATA_ATUALIZACAO_INVALIDA',
      }),
    );
  });

  it('marca um veículo disponível como vendido', () => {
    const veiculo = reconstruirVeiculo();

    const vendido = veiculo.vender(DATA_ATUALIZACAO);

    expect(vendido.identificador).toBe(IDENTIFICADOR);
    expect(vendido.marca).toBe('Honda');
    expect(vendido.situacao).toBe(SituacaoVeiculo.VENDIDO);
    expect(vendido.criadoEm).toEqual(DATA_CADASTRO);
    expect(vendido.atualizadoEm).toEqual(DATA_ATUALIZACAO);
  });

  it('rejeita a venda de um veículo já vendido', () => {
    const veiculo = reconstruirVeiculo({
      situacao: SituacaoVeiculo.VENDIDO,
    });

    expect(() => veiculo.vender(DATA_ATUALIZACAO)).toThrow(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'VEICULO_JA_VENDIDO',
      }),
    );
  });

  it('rejeita uma data de venda inválida', () => {
    const veiculo = reconstruirVeiculo();

    expect(() => veiculo.vender(new Date('inválida'))).toThrow(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'DATA_VENDA_INVALIDA',
      }),
    );
  });
});
