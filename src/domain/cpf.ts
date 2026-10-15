import { ErroDominio } from './erro-dominio';

function calcularDigito(base: string, pesoInicial: number): number {
  let soma = 0;

  for (let indice = 0; indice < base.length; indice += 1) {
    soma += Number(base[indice]) * (pesoInicial - indice);
  }

  const resto = soma % 11;

  return resto < 2 ? 0 : 11 - resto;
}

function cpfValido(valor: string): boolean {
  if (!/^\d{11}$/.test(valor) || /^(\d)\1{10}$/.test(valor)) {
    return false;
  }

  const primeiroDigito = calcularDigito(valor.slice(0, 9), 10);
  const segundoDigito = calcularDigito(
    `${valor.slice(0, 9)}${String(primeiroDigito)}`,
    11,
  );

  return valor.endsWith(`${String(primeiroDigito)}${String(segundoDigito)}`);
}

export class Cpf {
  private constructor(public readonly valor: string) {}

  public static criar(valor: string): Cpf {
    const valorNormalizado = valor.trim();

    if (!cpfValido(valorNormalizado)) {
      throw new ErroDominio(
        'CPF_INVALIDO',
        'O CPF do comprador deve ser válido e conter 11 dígitos.',
      );
    }

    return new Cpf(valorNormalizado);
  }
}
