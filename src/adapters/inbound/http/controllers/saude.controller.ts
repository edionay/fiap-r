import {
  Controller,
  Get,
  Route,
  SuccessResponse,
  Tags,
} from '@tsoa/runtime';
import {
  obterEstadoDeSaude,
  type EstadoDeSaude,
} from '../../../../application/saude/obter-estado-de-saude';

@Route('health')
@Tags('Saúde')
export class SaudeController extends Controller {
  @Get()
  @SuccessResponse(200, 'Saudável')
  public obterSaude(): EstadoDeSaude {
    return obterEstadoDeSaude();
  }
}
