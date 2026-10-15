import { describe, expect, it, vi } from 'vitest';
import { EditarVeiculo } from '../../../../src/application/veiculos/editar-veiculo';
import { ErroAplicacao } from '../../../../src/application/erro-aplicacao';
import { AnoFabricacao } from '../../../../src/domain/ano-fabricacao';
import { ErroDominio } from '../../../../src/domain/erro-dominio';
import { IdentificadorVeiculo } from '../../../../src/domain/identificador-veiculo';
import { Preco } from '../../../../src/domain/preco';
import { SituacaoVeiculo } from '../../../../src/domain/situacao-veiculo';
import { TipoEventoVeiculo } from '../../../../src/domain/tipo-evento-veiculo';
import { Veiculo } from '../../../../src/domain/veiculo';

const IDENTIFICADOR = '550e8400-e29b-41d4-a716-446655440000';
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');
const DATA_ATUALIZACAO = new Date('2026-10-15T14:30:00.000Z');

function criarVeiculo(situacao: SituacaoVeiculo = SituacaoVeiculo.DISPONIVEL) {
  return Veiculo.reconstruir({
    identificador: IdentificadorVeiculo.criar(IDENTIFICADOR),
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: AnoFabricacao.criar(2025, 2026),
    cor: 'Preto',
    precoAnunciado: Preco.criarEmCentavos(7_500_000),
    situacao,
    criadoEm: DATA_CADASTRO,
    atualizadoEm: DATA_CADASTRO,
  });
}

function prepararCasoDeUso(veiculo: Veiculo | null = criarVeiculo()) {
  const repositorioVeiculos = {
    buscarPorIdentificador: vi.fn().mockResolvedValue(veiculo),
    editarComHistorico: vi.fn().mockResolvedValue(undefined),
  };
  const relogio = {
    agora: vi.fn().mockReturnValue(new Date(DATA_ATUALIZACAO)),
  };
  const casoDeUso = new EditarVeiculo(repositorioVeiculos, relogio);

  return { casoDeUso, relogio, repositorioVeiculos };
}

describe('EditarVeiculo', () => {
  it('edita o veículo e seu histórico por uma única operação de persistência', async () => {
    const { casoDeUso, repositorioVeiculos } = prepararCasoDeUso();

    const resultado = await casoDeUso.executar({
      identificador: IDENTIFICADOR,
      marca: ' Toyota ',
      anoFabricacao: 2026,
      precoAnunciadoCentavos: 8_000_000,
    });

    expect(resultado).toEqual({
      identificador: IDENTIFICADOR,
      marca: 'Toyota',
      modelo: 'Civic',
      anoFabricacao: 2026,
      cor: 'Preto',
      precoAnunciadoCentavos: 8_000_000,
      situacao: SituacaoVeiculo.DISPONIVEL,
      criadoEm: DATA_CADASTRO,
      atualizadoEm: DATA_ATUALIZACAO,
    });
    expect(repositorioVeiculos.buscarPorIdentificador).toHaveBeenCalledWith(
      expect.objectContaining({ valor: IDENTIFICADOR }),
    );
    expect(repositorioVeiculos.editarComHistorico).toHaveBeenCalledOnce();
    expect(repositorioVeiculos.editarComHistorico).toHaveBeenCalledWith(
      expect.objectContaining({
        marca: 'Toyota',
        situacao: SituacaoVeiculo.DISPONIVEL,
      }),
      {
        tipo: TipoEventoVeiculo.EDITADO,
        veiculoId: IDENTIFICADOR,
        alteracoes: {
          marca: { anterior: 'Honda', atual: 'Toyota' },
          anoFabricacao: { anterior: 2025, atual: 2026 },
          precoAnunciadoCentavos: {
            anterior: 7_500_000,
            atual: 8_000_000,
          },
        },
        ocorridoEm: DATA_ATUALIZACAO.toISOString(),
      },
    );
  });

  it('não persiste quando os valores informados não alteram o veículo', async () => {
    const { casoDeUso, repositorioVeiculos } = prepararCasoDeUso();

    const resultado = await casoDeUso.executar({
      identificador: IDENTIFICADOR,
      marca: ' Honda ',
      precoAnunciadoCentavos: 7_500_000,
    });

    expect(resultado.atualizadoEm).toEqual(DATA_CADASTRO);
    expect(repositorioVeiculos.editarComHistorico).not.toHaveBeenCalled();
  });

  it('rejeita a edição quando o veículo não existe', async () => {
    const { casoDeUso, repositorioVeiculos, relogio } =
      prepararCasoDeUso(null);

    await expect(
      casoDeUso.executar({
        identificador: IDENTIFICADOR,
        cor: 'Branco',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ErroAplicacao>>({
        codigo: 'VEICULO_NAO_ENCONTRADO',
      }),
    );
    expect(relogio.agora).not.toHaveBeenCalled();
    expect(repositorioVeiculos.editarComHistorico).not.toHaveBeenCalled();
  });

  it('rejeita a edição de um veículo vendido sem persistir mudanças', async () => {
    const { casoDeUso, repositorioVeiculos } = prepararCasoDeUso(
      criarVeiculo(SituacaoVeiculo.VENDIDO),
    );

    await expect(
      casoDeUso.executar({
        identificador: IDENTIFICADOR,
        cor: 'Branco',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'VEICULO_NAO_DISPONIVEL',
      }),
    );
    expect(repositorioVeiculos.editarComHistorico).not.toHaveBeenCalled();
  });

  it('rejeita dados inválidos sem persistir mudanças', async () => {
    const { casoDeUso, repositorioVeiculos } = prepararCasoDeUso();

    await expect(
      casoDeUso.executar({
        identificador: IDENTIFICADOR,
        precoAnunciadoCentavos: 0,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'PRECO_INVALIDO',
      }),
    );
    expect(repositorioVeiculos.editarComHistorico).not.toHaveBeenCalled();
  });
});
