const PORTA_PADRAO = 3000;
const PORTA_MAXIMA = 65_535;
const LIMITE_PADRAO_DE_CONEXOES = 10;
const TEMPO_PADRAO_DE_INATIVIDADE_MS = 10_000;
const TEMPO_PADRAO_DE_CONEXAO_MS = 5_000;

export interface ConfiguracaoBancoDados {
  stringConexao: string;
  limiteConexoes: number;
  tempoInatividadeMs: number;
  tempoConexaoMs: number;
}

export interface ConfiguracaoAplicacao {
  porta: number;
  bancoDados: ConfiguracaoBancoDados;
}

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

function obterInteiroPositivo(
  nome: string,
  valor: string | undefined,
  valorPadrao: number,
): number {
  if (valor === undefined || valor.trim() === '') {
    return valorPadrao;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 1) {
    throw new Error(`${nome} deve ser um número inteiro positivo.`);
  }

  return numero;
}

function obterUrlBancoDados(valor: string | undefined): string {
  if (valor === undefined || valor.trim() === '') {
    throw new Error('DATABASE_URL é obrigatória.');
  }

  let url: URL;

  try {
    url = new URL(valor);
  } catch {
    throw new Error('DATABASE_URL deve ser uma URL válida do PostgreSQL.');
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL deve ser uma URL válida do PostgreSQL.');
  }

  return valor;
}

export function carregarConfiguracao(
  ambiente: NodeJS.ProcessEnv = process.env,
): ConfiguracaoAplicacao {
  return {
    porta: obterPorta(ambiente.PORT),
    bancoDados: {
      stringConexao: obterUrlBancoDados(ambiente.DATABASE_URL),
      limiteConexoes: obterInteiroPositivo(
        'DB_MAX_CONNECTIONS',
        ambiente.DB_MAX_CONNECTIONS,
        LIMITE_PADRAO_DE_CONEXOES,
      ),
      tempoInatividadeMs: obterInteiroPositivo(
        'DB_IDLE_TIMEOUT_MS',
        ambiente.DB_IDLE_TIMEOUT_MS,
        TEMPO_PADRAO_DE_INATIVIDADE_MS,
      ),
      tempoConexaoMs: obterInteiroPositivo(
        'DB_CONNECTION_TIMEOUT_MS',
        ambiente.DB_CONNECTION_TIMEOUT_MS,
        TEMPO_PADRAO_DE_CONEXAO_MS,
      ),
    },
  };
}
