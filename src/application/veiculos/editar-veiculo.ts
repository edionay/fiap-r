import { AnoFabricacao } from '../../domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../domain/identificador-veiculo';
import { Preco } from '../../domain/preco';
import type { SituacaoVeiculo } from '../../domain/situacao-veiculo';
import type {
  DadosEdicaoVeiculo as DadosEdicaoVeiculoDominio,
  Veiculo,
} from '../../domain/veiculo';
import { ErroAplicacao } from '../erro-aplicacao';
import type { Relogio } from '../ports/relogio';
import type { RepositorioVeiculos } from '../ports/repositorio-veiculos';

export interface DadosEdicaoVeiculo {
  identificador: string;
  marca?: string | undefined;
  modelo?: string | undefined;
  anoFabricacao?: number | undefined;
  cor?: string | undefined;
  precoAnunciadoCentavos?: number | undefined;
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
  dados: DadosEdicaoVeiculo,
  anoAtual: number,
): DadosEdicaoVeiculoDominio {
  return {
    marca: dados.marca,
    modelo: dados.modelo,
    anoFabricacao:
      dados.anoFabricacao === undefined
        ? undefined
        : AnoFabricacao.criar(dados.anoFabricacao, anoAtual),
    cor: dados.cor,
    precoAnunciado:
      dados.precoAnunciadoCentavos === undefined
        ? undefined
        : Preco.criarEmCentavos(dados.precoAnunciadoCentavos),
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
    private readonly repositorioVeiculos: RepositorioVeiculos,
    private readonly relogio: Relogio,
  ) {}

  public async executar(
    dados: DadosEdicaoVeiculo,
  ): Promise<ResultadoEditarVeiculo> {
    const identificador = IdentificadorVeiculo.criar(dados.identificador);
    const veiculo =
      await this.repositorioVeiculos.buscarPorIdentificador(identificador);

    if (veiculo === null) {
      throw new ErroAplicacao(
        'VEICULO_NAO_ENCONTRADO',
        'O veículo informado não foi encontrado.',
      );
    }

    const atualizadoEm = this.relogio.agora();
    const dadosEdicao = criarDadosEdicao(
      dados,
      atualizadoEm.getUTCFullYear(),
    );
    const veiculoAtualizado = veiculo.editar(dadosEdicao, atualizadoEm);

    await this.repositorioVeiculos.editar(veiculoAtualizado);

    return criarResultado(veiculoAtualizado);
  }
}
