import { randomUUID } from 'node:crypto';
import type { GeradorIdentificadores } from '../../application/ports/gerador-identificadores';

export class GeradorIdentificadoresUuid implements GeradorIdentificadores {
  public gerar(): string {
    return randomUUID();
  }
}
