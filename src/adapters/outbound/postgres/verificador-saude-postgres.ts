import type { Pool } from 'pg';
import type { VerificadorSaudeBancoDados } from '../../../application/ports/verificador-saude-banco-dados';

export class VerificadorSaudePostgres implements VerificadorSaudeBancoDados {
  public constructor(private readonly pool: Pool) {}

  public async estaPronto(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
