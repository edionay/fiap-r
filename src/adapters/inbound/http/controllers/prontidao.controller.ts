import {
  Controller,
  Get,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from '@tsoa/runtime';
import {
  type EstadoDeProntidao,
  ObterEstadoDeProntidao,
} from '../../../../application/saude/obter-estado-de-prontidao';

@Route('ready')
@Tags('Saúde')
export class ProntidaoController extends Controller {
  public constructor(
    private readonly obterEstadoDeProntidao: ObterEstadoDeProntidao,
  ) {
    super();
  }

  @Get()
  @SuccessResponse(200, 'Pronta')
  @Response<EstadoDeProntidao>(503, 'Não pronta')
  public async obterProntidao(): Promise<EstadoDeProntidao> {
    const estado = await this.obterEstadoDeProntidao.obter();

    if (estado.status === 'not_ready') {
      this.setStatus(503);
    }

    return estado;
  }
}
