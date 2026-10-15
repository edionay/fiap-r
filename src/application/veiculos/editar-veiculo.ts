import { AnoFabricacao } from '../../domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../domain/identificador-veiculo';
import { Preco } from '../../domain/preco';
import type { SituacaoVeiculo } from '../../domain/situacao-veiculo';
import type { DadosEdicaoVeiculo, Veiculo } from '../../domain/veiculo';
import { ErroAplicacao } from '../erro-aplicacao';
import type { Relogio } from '../ports/relogio';
import type { RepositorioEdicaoVeiculos } from '../ports/repositorio-veiculos';

export interface ComandoEditarVeiculo {
  identificador: string;
  marca?: string;
  modelo?: string;
  anoFabricacao?: number;
  cor?: string;
  precoAnunciadoCentavos?: number;
}

export interface ResultadoEditarVeiculo {
  identificador: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  cor: string;
  precoAnunciadoCentavos: number;
  situacao: SituacaoVeiculo;
  criadoEm: Date;
  atualizadoEm: Date;
}

function criarDadosEdicao(
  comando: ComandoEditarVeiculo,
  anoAtual: number,
): DadosEdicaoVeiculo {
  return {
    ...(comando.marca === undefined ? {} : { marca: comando.marca }),
    ...(comando.modelo === undefined ? {} : { modelo: comando.modelo }),
    ...(comando.anoFabricacao === undefined
      ? {}
      : {
          anoFabricacao: AnoFabricacao.criar(
            comando.anoFabricacao,
            anoAtual,
          ),
        }),
    ...(comando.cor === undefined ? {} : { cor: comando.cor }),
    ...(comando.precoAnunciadoCentavos === undefined
      ? {}
      : {
          precoAnunciado: Preco.criarEmCentavos(
            comando.precoAnunciadoCentavos,
          ),
        }),
  };
}

function criarResultado(veiculo: Veiculo): ResultadoEditarVeiculo {
  return {
    identificador: veiculo.identificador.valor,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    anoFabricacao: veiculo.anoFabricacao.valor,
    cor: veiculo.cor,
    precoAnunciadoCentavos: veiculo.precoAnunciado.centavos,
    situacao: veiculo.situacao,
    criadoEm: veiculo.criadoEm,
    atualizadoEm: veiculo.atualizadoEm,
  };
}

export class EditarVeiculo {
  public constructor(
    private readonly repositorioVeiculos: RepositorioEdicaoVeiculos,
    private readonly relogio: Relogio,
  ) {}

  public async executar(
    comando: ComandoEditarVeiculo,
  ): Promise<ResultadoEditarVeiculo> {
    const identificador = IdentificadorVeiculo.criar(comando.identificador);
    const veiculo =
      await this.repositorioVeiculos.buscarPorIdentificador(identificador);

    if (veiculo === null) {
      throw new ErroAplicacao(
        'VEICULO_NAO_ENCONTRADO',
        'O veículo informado não foi encontrado.',
      );
    }

    const atualizadoEm = this.relogio.agora();
    const atualizadoEmEsperado = veiculo.atualizadoEm;
    const dadosEdicao = criarDadosEdicao(
      comando,
      atualizadoEm.getUTCFullYear(),
    );
    const resultado = veiculo.editar(dadosEdicao, atualizadoEm);

    if (resultado.evento !== null) {
      const edicaoRealizada =
        await this.repositorioVeiculos.editarComHistorico(
          resultado.veiculo,
          resultado.evento,
          atualizadoEmEsperado,
        );

      if (!edicaoRealizada) {
        throw new ErroAplicacao(
          'VEICULO_ALTERADO_CONCORRENTEMENTE',
          'O veículo foi alterado por outra operação.',
        );
      }
    }

    return criarResultado(resultado.veiculo);
  }
}
