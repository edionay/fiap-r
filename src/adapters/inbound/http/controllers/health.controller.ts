import {
  Controller,
  Get,
  Route,
  SuccessResponse,
  Tags,
} from '@tsoa/runtime';
import {
  getHealthStatus,
  type HealthStatus,
} from '../../../../application/health/get-health-status';

@Route('health')
@Tags('Health')
export class HealthController extends Controller {
  @Get()
  @SuccessResponse(200, 'Healthy')
  public getHealth(): HealthStatus {
    return getHealthStatus();
  }
}
