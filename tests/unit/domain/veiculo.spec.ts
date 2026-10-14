import { describe, expect, it } from 'vitest';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { ErroDominio } from '../../../src/domain/erro-dominio';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Preco } from '../../../src/domain/preco';
import { SituacaoVeiculo } from '../../../src/domain/situacao-veiculo';
import { Veiculo } from '../../../src/domain/veiculo';
import { TipoEventoVeiculo } from '../../../src/domain/tipo-evento-veiculo';

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

  it('reconstrói um veículo persistido sem produzir evento', () => {
    const criadoEm = new Date(DATA_CADASTRO);
    const atualizadoEm = new Date(DATA_ATUALIZACAO);

    const veiculo = reconstruirVeiculo({
      situacao: SituacaoVeiculo.VENDIDO,
      criadoEm,
      atualizadoEm,
    });
    criadoEm.setUTCFullYear(2030);
    atualizadoEm.setUTCFullYear(2030);

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

  it('edita os dados informados e registra apenas as mudanças efetivas', () => {
    const veiculo = reconstruirVeiculo();
    const novoPreco = Preco.criarEmCentavos(8_000_000);

    const resultado = veiculo.editar(
      {
        marca: ' Toyota ',
        modelo: 'Civic',
        precoAnunciado: novoPreco,
      },
      DATA_ATUALIZACAO,
    );

    expect(resultado.veiculo).not.toBe(veiculo);
    expect(resultado.veiculo.marca).toBe('Toyota');
    expect(resultado.veiculo.modelo).toBe('Civic');
    expect(resultado.veiculo.precoAnunciado).toBe(novoPreco);
    expect(resultado.veiculo.criadoEm).toEqual(DATA_CADASTRO);
    expect(resultado.veiculo.atualizadoEm).toEqual(DATA_ATUALIZACAO);
    expect(resultado.evento).toEqual({
      tipo: TipoEventoVeiculo.EDITADO,
      veiculoId: IDENTIFICADOR.valor,
      alteracoes: {
        marca: { anterior: 'Honda', atual: 'Toyota' },
        precoAnunciadoCentavos: {
          anterior: 7_500_000,
          atual: 8_000_000,
        },
      },
      ocorridoEm: DATA_ATUALIZACAO.toISOString(),
    });
  });

  it('edita ano, modelo e cor quando os valores mudam', () => {
    const veiculo = reconstruirVeiculo();
    const novoAno = AnoFabricacao.criar(2026, 2026);

    const { veiculo: editado, evento } = veiculo.editar(
      {
        modelo: 'Accord',
        anoFabricacao: novoAno,
        cor: 'Branco',
      },
      DATA_ATUALIZACAO,
    );

    expect(editado.modelo).toBe('Accord');
    expect(editado.anoFabricacao).toBe(novoAno);
    expect(editado.cor).toBe('Branco');
    expect(evento?.alteracoes).toEqual({
      modelo: { anterior: 'Civic', atual: 'Accord' },
      anoFabricacao: { anterior: 2025, atual: 2026 },
      cor: { anterior: 'Preto', atual: 'Branco' },
    });
  });

  it('mantém o veículo e não produz evento quando nada muda', () => {
    const veiculo = reconstruirVeiculo();

    const resultado = veiculo.editar(
      {
        marca: ' Honda ',
        precoAnunciado: Preco.criarEmCentavos(7_500_000),
      },
      DATA_ATUALIZACAO,
    );

    expect(resultado).toEqual({ veiculo, evento: null });
    expect(resultado.veiculo.atualizadoEm).toEqual(DATA_CADASTRO);
  });

  it('rejeita a edição de um veículo vendido', () => {
    const veiculo = reconstruirVeiculo({
      situacao: SituacaoVeiculo.VENDIDO,
    });

    expect(() =>
      veiculo.editar({ cor: 'Branco' }, DATA_ATUALIZACAO),
    ).toThrow(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'VEICULO_NAO_DISPONIVEL',
      }),
    );
  });

  it('rejeita uma data de atualização inválida quando há mudança', () => {
    const veiculo = reconstruirVeiculo();

    expect(() =>
      veiculo.editar({ cor: 'Branco' }, new Date('inválida')),
    ).toThrow(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'DATA_ATUALIZACAO_INVALIDA',
      }),
    );
  });

  it('produz um evento de edição profundamente imutável', () => {
    const veiculo = reconstruirVeiculo();

    const { evento } = veiculo.editar(
      { cor: 'Branco' },
      DATA_ATUALIZACAO,
    );

    expect(evento).not.toBeNull();
    expect(Object.isFrozen(evento)).toBe(true);
    expect(Object.isFrozen(evento?.alteracoes)).toBe(true);
    expect(Object.isFrozen(evento?.alteracoes.cor)).toBe(true);
  });
});
