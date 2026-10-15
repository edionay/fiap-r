import {
  Body,
  Controller,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from '@tsoa/runtime';
import {
  CadastrarVeiculo,
  type ResultadoCadastrarVeiculo,
} from '../../../../application/veiculos/cadastrar-veiculo';
import type { SituacaoVeiculo } from '../../../../domain/situacao-veiculo';
import type { RespostaDeErro } from '../middlewares/tratador-de-erros';
import {
  converterPrecoParaCentavos,
  formatarCentavos,
} from '../preco-http';

export interface RequisicaoCadastroVeiculo {
  marca: string;
  modelo: string;
  /** @isInt */
  anoFabricacao: number;
  cor: string;
  precoAnunciado: string;
}

export interface RespostaVeiculoCadastrado {
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
  resultado: ResultadoCadastrarVeiculo,
): RespostaVeiculoCadastrado {
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
export class VeiculosController extends Controller {
  public constructor(
    private readonly cadastrarVeiculo: CadastrarVeiculo,
  ) {
    super();
  }

  @Post()
  @SuccessResponse(201, 'Veículo cadastrado')
  @Response<RespostaDeErro>(400, 'Requisição inválida')
  @Response<RespostaDeErro>(422, 'Regra de negócio não atendida')
  public async cadastrar(
    @Body() requisicao: RequisicaoCadastroVeiculo,
  ): Promise<RespostaVeiculoCadastrado> {
    const resultado = await this.cadastrarVeiculo.executar({
      marca: requisicao.marca,
      modelo: requisicao.modelo,
      anoFabricacao: requisicao.anoFabricacao,
      cor: requisicao.cor,
      precoAnunciadoCentavos: converterPrecoParaCentavos(
        requisicao.precoAnunciado,
      ),
    });

    this.setStatus(201);
    return criarResposta(resultado);
  }
}
