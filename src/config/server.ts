import { criarAplicacao } from '../adapters/inbound/http/app';
import { criarPoolPostgres } from '../adapters/outbound/postgres/pool';
import { VerificadorSaudePostgres } from '../adapters/outbound/postgres/verificador-saude-postgres';
import { ObterEstadoDeProntidao } from '../application/saude/obter-estado-de-prontidao';
import { carregarConfiguracao } from './env';

const configuracao = carregarConfiguracao();
const pool = criarPoolPostgres(configuracao.bancoDados);
const verificadorSaudePostgres = new VerificadorSaudePostgres(pool);
const obterEstadoDeProntidao = new ObterEstadoDeProntidao(
  verificadorSaudePostgres,
);

const aplicacao = criarAplicacao({ obterEstadoDeProntidao });

const servidor = aplicacao.listen(configuracao.porta, () => {
  console.log(
    `API de gerenciamento de veículos ouvindo na porta ${String(configuracao.porta)}.`,
  );
});

async function encerrar(sinal: NodeJS.Signals): Promise<void> {
  console.log(`Sinal ${sinal} recebido. Encerrando a aplicação.`);

  await new Promise<void>((resolver, rejeitar) => {
    servidor.close((erro) => {
      if (erro !== undefined) {
        rejeitar(erro);
        return;
      }

      resolver();
    });
  });

  await pool.end();
}

function registrarEncerramento(sinal: NodeJS.Signals): void {
  process.once(sinal, () => {
    void encerrar(sinal).catch((erro: unknown) => {
      console.error('Não foi possível encerrar a aplicação corretamente.', erro);
      process.exitCode = 1;
    });
  });
}

registrarEncerramento('SIGINT');
registrarEncerramento('SIGTERM');
