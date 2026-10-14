import type { Relogio } from '../../application/ports/relogio';

export class RelogioSistema implements Relogio {
  public agora(): Date {
    return new Date();
  }
}
