import { Pool } from 'pg';
import type { ConfiguracaoBancoDados } from '../../../config/env';

export function criarPoolPostgres(configuracao: ConfiguracaoBancoDados): Pool {
  const pool = new Pool({
    connectionString: configuracao.stringConexao,
    max: configuracao.limiteConexoes,
    idleTimeoutMillis: configuracao.tempoInatividadeMs,
    connectionTimeoutMillis: configuracao.tempoConexaoMs,
  });

  pool.on('error', (erro: Error) => {
    console.error('Erro inesperado no pool do PostgreSQL.', erro);
  });

  return pool;
}
