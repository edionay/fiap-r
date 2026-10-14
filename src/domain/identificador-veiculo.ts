import { ErroDominio } from './erro-dominio';

const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class IdentificadorVeiculo {
  private constructor(public readonly valor: string) {}

  public static criar(valor: string): IdentificadorVeiculo {
    const valorNormalizado = valor.trim().toLowerCase();

    if (!FORMATO_UUID.test(valorNormalizado)) {
      throw new ErroDominio(
        'IDENTIFICADOR_VEICULO_INVALIDO',
        'O identificador do veículo deve ser um UUID válido.',
      );
    }

    return new IdentificadorVeiculo(valorNormalizado);
  }

  public igualA(outro: IdentificadorVeiculo): boolean {
    return this.valor === outro.valor;
  }
}
