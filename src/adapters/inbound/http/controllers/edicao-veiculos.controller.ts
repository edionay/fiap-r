import {
  Body,
  Controller,
  Patch,
  Path,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from '@tsoa/runtime';
import {
  EditarVeiculo,
  type ResultadoEditarVeiculo,
} from '../../../../application/veiculos/editar-veiculo';
import type { SituacaoVeiculo } from '../../../../domain/situacao-veiculo';
import type { RespostaDeErro } from '../middlewares/tratador-de-erros';
import {
  converterPrecoParaCentavos,
  formatarCentavos,
} from '../preco-http';

export interface RequisicaoEdicaoVeiculo {
  marca?: string;
  modelo?: string;
  /** @isInt */
  anoFabricacao?: number;
  cor?: string;
  precoAnunciado?: string;
}

export interface RespostaVeiculoEditado {
  id: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  cor: string;
  precoAnunciado: string;
  situacao: SituacaoVeiculo;
  criadoEm: Date;
  atualizadoEm: Date;
}

function criarResposta(
  resultado: ResultadoEditarVeiculo,
): RespostaVeiculoEditado {
  return {
    id: resultado.identificador,
    marca: resultado.marca,
    modelo: resultado.modelo,
    anoFabricacao: resultado.anoFabricacao,
    cor: resultado.cor,
    precoAnunciado: formatarCentavos(resultado.precoAnunciadoCentavos),
    situacao: resultado.situacao,
    criadoEm: resultado.criadoEm,
    atualizadoEm: resultado.atualizadoEm,
  };
}

@Route('veiculos')
@Tags('Veículos')
export class EdicaoVeiculosController extends Controller {
  public constructor(private readonly editarVeiculo: EditarVeiculo) {
    super();
  }

  @Patch('{veiculoId}')
  @SuccessResponse(200, 'Veículo editado')
  @Response<RespostaDeErro>(400, 'Requisição inválida')
  @Response<RespostaDeErro>(404, 'Veículo não encontrado')
  @Response<RespostaDeErro>(422, 'Regra de negócio não atendida')
  public async editar(
    @Path() veiculoId: string,
    @Body() requisicao: RequisicaoEdicaoVeiculo,
  ): Promise<RespostaVeiculoEditado> {
    const resultado = await this.editarVeiculo.executar({
      identificador: veiculoId,
      marca: requisicao.marca,
      modelo: requisicao.modelo,
      anoFabricacao: requisicao.anoFabricacao,
      cor: requisicao.cor,
      precoAnunciadoCentavos:
        requisicao.precoAnunciado === undefined
          ? undefined
          : converterPrecoParaCentavos(requisicao.precoAnunciado),
    });

    return criarResposta(resultado);
  }
}
