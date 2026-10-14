import { ErroDominio } from './erro-dominio';

const PRIMEIRO_ANO_AUTOMOVEL = 1886;

export class AnoFabricacao {
  private constructor(public readonly valor: number) {}

  public static criar(valor: number, anoAtual: number): AnoFabricacao {
    const ultimoAnoPermitido = anoAtual + 1;

    if (
      !Number.isInteger(valor) ||
      !Number.isInteger(anoAtual) ||
      valor < PRIMEIRO_ANO_AUTOMOVEL ||
      valor > ultimoAnoPermitido
    ) {
      throw new ErroDominio(
        'ANO_FABRICACAO_INVALIDO',
        `O ano de fabricação deve estar entre ${String(PRIMEIRO_ANO_AUTOMOVEL)} e ${String(ultimoAnoPermitido)}.`,
      );
    }

    return new AnoFabricacao(valor);
  }

  public igualA(outro: AnoFabricacao): boolean {
    return this.valor === outro.valor;
  }
}
