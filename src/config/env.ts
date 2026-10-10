const PORTA_PADRAO = 3000;
const PORTA_MAXIMA = 65_535;

export function obterPorta(valor: string | undefined): number {
  if (valor === undefined || valor.trim() === '') {
    return PORTA_PADRAO;
  }

  const porta = Number(valor);

  if (!Number.isInteger(porta) || porta < 1 || porta > PORTA_MAXIMA) {
    throw new Error('PORT deve ser um número inteiro entre 1 e 65535.');
  }

  return porta;
}
