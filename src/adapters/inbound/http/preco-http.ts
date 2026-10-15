import { ErroRequisicao } from './erro-requisicao';

const FORMATO_PRECO = /^-?\d{1,14}(?:\.\d{1,2})?$/;
const MAIOR_INTEIRO_SEGURO = BigInt(Number.MAX_SAFE_INTEGER);

export function converterPrecoParaCentavos(preco: string): number {
  if (!FORMATO_PRECO.test(preco)) {
    throw new ErroRequisicao(
      'PRECO_ANUNCIADO_INVALIDO',
      'O preço anunciado deve ser uma string decimal com até duas casas decimais.',
      {
        precoAnunciado:
          'Informe um valor como "75000.99", sem separador de milhares.',
      },
    );
  }

  const negativo = preco.startsWith('-');
  const valorSemSinal = negativo ? preco.slice(1) : preco;
  const [parteInteira = '0', parteDecimal = ''] = valorSemSinal.split('.');
  const centavosAbsolutos =
    BigInt(parteInteira) * 100n + BigInt(parteDecimal.padEnd(2, '0'));
  const centavos = negativo ? -centavosAbsolutos : centavosAbsolutos;

  if (
    centavos > MAIOR_INTEIRO_SEGURO ||
    centavos < -MAIOR_INTEIRO_SEGURO
  ) {
    throw new ErroRequisicao(
      'PRECO_ANUNCIADO_INVALIDO',
      'O preço anunciado está fora do limite aceito.',
    );
  }

  return Number(centavos);
}

export function formatarCentavos(centavos: number): string {
  const parteInteira = Math.trunc(centavos / 100);
  const parteDecimal = centavos % 100;

  return `${String(parteInteira)}.${String(parteDecimal).padStart(2, '0')}`;
}
