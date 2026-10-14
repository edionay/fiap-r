import { ErroDominio } from './erro-dominio';

const LIMITE_CENTAVOS = 999_999_999_999;

export class Preco {
  private constructor(public readonly centavos: number) {}

  public static criarEmCentavos(centavos: number): Preco {
    if (
      !Number.isSafeInteger(centavos) ||
      centavos <= 0 ||
      centavos > LIMITE_CENTAVOS
    ) {
      throw new ErroDominio(
        'PRECO_INVALIDO',
        'O preço deve ser positivo e representado em centavos inteiros dentro do limite permitido.',
      );
    }

    return new Preco(centavos);
  }

  public igualA(outro: Preco): boolean {
    return this.centavos === outro.centavos;
  }
}
