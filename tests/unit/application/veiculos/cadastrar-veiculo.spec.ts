import { describe, expect, it, vi } from 'vitest';
import { CadastrarVeiculo } from '../../../../src/application/veiculos/cadastrar-veiculo';
import { ErroDominio } from '../../../../src/domain/erro-dominio';
import { SituacaoVeiculo } from '../../../../src/domain/situacao-veiculo';
import { TipoEventoVeiculo } from '../../../../src/domain/veiculo-cadastrado';

const IDENTIFICADOR = '550e8400-e29b-41d4-a716-446655440000';
const DATA_ATUAL = new Date('2026-10-14T12:00:00.000Z');

function prepararCasoDeUso() {
  const repositorioVeiculos = {
    cadastrarComHistorico: vi.fn().mockResolvedValue(undefined),
  };
  const geradorIdentificadores = {
    gerar: vi.fn().mockReturnValue(IDENTIFICADOR),
  };
  const relogio = {
    agora: vi.fn().mockReturnValue(new Date(DATA_ATUAL)),
  };
  const casoDeUso = new CadastrarVeiculo(
    repositorioVeiculos,
    geradorIdentificadores,
    relogio,
  );

  return {
    casoDeUso,
    geradorIdentificadores,
    relogio,
    repositorioVeiculos,
  };
}

function dadosValidos() {
  return {
    marca: ' Honda ',
    modelo: ' Civic ',
    anoFabricacao: 2025,
    cor: ' Preto ',
    precoAnunciadoCentavos: 7_500_000,
  };
}

describe('CadastrarVeiculo', () => {
  it('cadastra o veículo e seu evento por uma única operação de persistência', async () => {
    const { casoDeUso, repositorioVeiculos } = prepararCasoDeUso();

    const resultado = await casoDeUso.cadastrar(dadosValidos());

    expect(resultado).toEqual({
      identificador: IDENTIFICADOR,
      marca: 'Honda',
      modelo: 'Civic',
      anoFabricacao: 2025,
      cor: 'Preto',
      precoAnunciadoCentavos: 7_500_000,
      situacao: SituacaoVeiculo.DISPONIVEL,
      criadoEm: DATA_ATUAL,
      atualizadoEm: DATA_ATUAL,
    });
    expect(repositorioVeiculos.cadastrarComHistorico).toHaveBeenCalledOnce();
    expect(repositorioVeiculos.cadastrarComHistorico).toHaveBeenCalledWith(
      expect.objectContaining({
        marca: 'Honda',
        modelo: 'Civic',
        cor: 'Preto',
        situacao: SituacaoVeiculo.DISPONIVEL,
      }),
      {
        tipo: TipoEventoVeiculo.CADASTRADO,
        veiculoId: IDENTIFICADOR,
        dados: {
          marca: 'Honda',
          modelo: 'Civic',
          anoFabricacao: 2025,
          cor: 'Preto',
          precoAnunciadoCentavos: 7_500_000,
          situacao: SituacaoVeiculo.DISPONIVEL,
        },
        ocorridoEm: DATA_ATUAL.toISOString(),
      },
    );
  });

  it('obtém o identificador e a data pelas portas da aplicação', async () => {
    const { casoDeUso, geradorIdentificadores, relogio } = prepararCasoDeUso();

    await casoDeUso.cadastrar(dadosValidos());

    expect(geradorIdentificadores.gerar).toHaveBeenCalledOnce();
    expect(relogio.agora).toHaveBeenCalledOnce();
  });

  it('usa o ano UTC do relógio para validar o ano de fabricação', async () => {
    const { casoDeUso, relogio } = prepararCasoDeUso();
    relogio.agora.mockReturnValue(new Date('2026-12-31T23:30:00.000-03:00'));

    await expect(
      casoDeUso.cadastrar({
        ...dadosValidos(),
        anoFabricacao: 2028,
      }),
    ).resolves.toMatchObject({ anoFabricacao: 2028 });
  });

  it('não persiste quando os dados do veículo são inválidos', async () => {
    const { casoDeUso, repositorioVeiculos } = prepararCasoDeUso();

    await expect(
      casoDeUso.cadastrar({
        ...dadosValidos(),
        marca: '   ',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'MARCA_OBRIGATORIA',
      }),
    );
    expect(repositorioVeiculos.cadastrarComHistorico).not.toHaveBeenCalled();
  });

  it('não persiste quando o preço é inválido', async () => {
    const { casoDeUso, repositorioVeiculos } = prepararCasoDeUso();

    await expect(
      casoDeUso.cadastrar({
        ...dadosValidos(),
        precoAnunciadoCentavos: 0,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'PRECO_INVALIDO',
      }),
    );
    expect(repositorioVeiculos.cadastrarComHistorico).not.toHaveBeenCalled();
  });

  it('não persiste quando o identificador gerado é inválido', async () => {
    const { casoDeUso, geradorIdentificadores, repositorioVeiculos } =
      prepararCasoDeUso();
    geradorIdentificadores.gerar.mockReturnValue('identificador-invalido');

    await expect(casoDeUso.cadastrar(dadosValidos())).rejects.toEqual(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'IDENTIFICADOR_VEICULO_INVALIDO',
      }),
    );
    expect(repositorioVeiculos.cadastrarComHistorico).not.toHaveBeenCalled();
  });
});
