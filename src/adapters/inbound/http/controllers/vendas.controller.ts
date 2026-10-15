import {
  Body,
  Controller,
  Path,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from '@tsoa/runtime';
import {
  RegistrarVenda,
  type ResultadoRegistrarVenda,
} from '../../../../application/vendas/registrar-venda';
import type { SituacaoVeiculo } from '../../../../domain/situacao-veiculo';
import type { RespostaDeErro } from '../middlewares/tratador-de-erros';

export interface RequisicaoRegistroVenda {
  cpfComprador: string;
  vendidoEm: Date;
}

export interface RespostaVendaRegistrada {
  id: string;
  veiculoId: string;
  situacao: SituacaoVeiculo;
  vendidoEm: Date;
}

function criarResposta(
  resultado: ResultadoRegistrarVenda,
): RespostaVendaRegistrada {
  return {
    id: resultado.identificador,
    veiculoId: resultado.veiculoId,
    situacao: resultado.situacao,
    vendidoEm: resultado.vendidoEm,
  };
}

@Route('veiculos')
@Tags('Vendas')
export class VendasController extends Controller {
  public constructor(private readonly registrarVenda: RegistrarVenda) {
    super();
  }

  @Post('{veiculoId}/vendas')
  @SuccessResponse(201, 'Venda registrada')
  @Response<RespostaDeErro>(400, 'Requisição inválida')
  @Response<RespostaDeErro>(404, 'Veículo não encontrado')
  @Response<RespostaDeErro>(409, 'Veículo já vendido')
  @Response<RespostaDeErro>(422, 'Regra de negócio não atendida')
  public async registrar(
    @Path() veiculoId: string,
    @Body() requisicao: RequisicaoRegistroVenda,
  ): Promise<RespostaVendaRegistrada> {
    const resultado = await this.registrarVenda.executar({
      veiculoId,
      cpfComprador: requisicao.cpfComprador,
      vendidoEm: requisicao.vendidoEm,
    });

    this.setStatus(201);
    return criarResposta(resultado);
  }
}
