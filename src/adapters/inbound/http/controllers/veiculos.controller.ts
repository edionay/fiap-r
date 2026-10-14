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
import { ErroRequisicao } from '../erro-requisicao';
import type { RespostaDeErro } from '../middlewares/tratador-de-erros';

const FORMATO_PRECO = /^-?\d{1,14}(?:\.\d{1,2})?$/;
const MAIOR_INTEIRO_SEGURO = BigInt(Number.MAX_SAFE_INTEGER);

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

function converterPrecoParaCentavos(preco: string): number {
  if (!FORMATO_PRECO.test(preco)) {
    throw new ErroRequisicao(
      'PRECO_ANUNCIADO_INVALIDO',
      'O preço anunciado deve ser uma string decimal com até duas casas decimais.',
      {
        precoAnunciado:
          'Informe um valor como "75000.99", sem separador de milhares.',
      },
    );
  }

  const negativo = preco.startsWith('-');
  const valorSemSinal = negativo ? preco.slice(1) : preco;
  const [parteInteira = '0', parteDecimal = ''] = valorSemSinal.split('.');
  const centavosAbsolutos =
    BigInt(parteInteira) * 100n + BigInt(parteDecimal.padEnd(2, '0'));
  const centavos = negativo ? -centavosAbsolutos : centavosAbsolutos;

  if (
    centavos > MAIOR_INTEIRO_SEGURO ||
    centavos < -MAIOR_INTEIRO_SEGURO
  ) {
    throw new ErroRequisicao(
      'PRECO_ANUNCIADO_INVALIDO',
      'O preço anunciado está fora do limite aceito.',
    );
  }

  return Number(centavos);
}

function formatarCentavos(centavos: number): string {
  const parteInteira = Math.trunc(centavos / 100);
  const parteDecimal = centavos % 100;

  return `${String(parteInteira)}.${String(parteDecimal).padStart(2, '0')}`;
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
