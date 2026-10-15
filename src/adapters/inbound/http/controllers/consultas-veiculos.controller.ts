import {
  Controller,
  Get,
  Query,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from '@tsoa/runtime';
import {
  ListarVeiculos,
  type VeiculoListado,
} from '../../../../application/veiculos/listar-veiculos';
import type { SituacaoVeiculo } from '../../../../domain/situacao-veiculo';
import type { RespostaDeErro } from '../middlewares/tratador-de-erros';
import { formatarCentavos } from '../preco-http';

export interface RespostaVeiculoListado {
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

function criarResposta(veiculo: VeiculoListado): RespostaVeiculoListado {
  return {
    id: veiculo.identificador,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    anoFabricacao: veiculo.anoFabricacao,
    cor: veiculo.cor,
    precoAnunciado: formatarCentavos(veiculo.precoAnunciadoCentavos),
    situacao: veiculo.situacao,
    criadoEm: veiculo.criadoEm,
    atualizadoEm: veiculo.atualizadoEm,
  };
}

@Route('veiculos')
@Tags('Veículos')
export class ConsultasVeiculosController extends Controller {
  public constructor(private readonly listarVeiculos: ListarVeiculos) {
    super();
  }

  @Get()
  @SuccessResponse(200, 'Veículos listados')
  @Response<RespostaDeErro>(400, 'Requisição inválida')
  public async listar(
    @Query() situacao: SituacaoVeiculo,
  ): Promise<RespostaVeiculoListado[]> {
    const veiculos = await this.listarVeiculos.executar(situacao);

    return veiculos.map(criarResposta);
  }
}
