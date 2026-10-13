import type { VerificadorSaudeBancoDados } from '../ports/verificador-saude-banco-dados';

export interface EstadoDeProntidao {
  status: 'ready' | 'not_ready';
}

export class ObterEstadoDeProntidao {
  public constructor(
    private readonly verificadorSaudeBancoDados: VerificadorSaudeBancoDados,
  ) {}

  public async executar(): Promise<EstadoDeProntidao> {
    const estaPronto = await this.verificadorSaudeBancoDados.estaPronto();

    return { status: estaPronto ? 'ready' : 'not_ready' };
  }
}
