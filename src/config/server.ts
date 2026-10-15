import { criarAplicacao } from '../adapters/inbound/http/app';
import { GeradorIdentificadoresUuid } from '../adapters/outbound/gerador-identificadores-uuid';
import { criarPoolPostgres } from '../adapters/outbound/postgres/pool';
import { RepositorioVeiculosPostgres } from '../adapters/outbound/postgres/repositorio-veiculos-postgres';
import { RepositorioVendasPostgres } from '../adapters/outbound/postgres/repositorio-vendas-postgres';
import { VerificadorSaudePostgres } from '../adapters/outbound/postgres/verificador-saude-postgres';
import { RelogioSistema } from '../adapters/outbound/relogio-sistema';
import { ObterEstadoDeProntidao } from '../application/saude/obter-estado-de-prontidao';
import { CadastrarVeiculo } from '../application/veiculos/cadastrar-veiculo';
import { EditarVeiculo } from '../application/veiculos/editar-veiculo';
import { ListarVeiculos } from '../application/veiculos/listar-veiculos';
import { RegistrarVenda } from '../application/vendas/registrar-venda';
import { carregarConfiguracao } from './env';

const configuracao = carregarConfiguracao();
const pool = criarPoolPostgres(configuracao.bancoDados);
const geradorIdentificadores = new GeradorIdentificadoresUuid();
const verificadorSaudePostgres = new VerificadorSaudePostgres(pool);
const repositorioVeiculos = new RepositorioVeiculosPostgres(pool);
const repositorioVendas = new RepositorioVendasPostgres(pool);
const obterEstadoDeProntidao = new ObterEstadoDeProntidao(
  verificadorSaudePostgres,
);
const relogio = new RelogioSistema();
const cadastrarVeiculo = new CadastrarVeiculo(
  repositorioVeiculos,
  geradorIdentificadores,
  relogio,
);
const editarVeiculo = new EditarVeiculo(repositorioVeiculos, relogio);
const listarVeiculos = new ListarVeiculos(repositorioVeiculos);
const registrarVenda = new RegistrarVenda(
  repositorioVeiculos,
  repositorioVendas,
  geradorIdentificadores,
);

const aplicacao = criarAplicacao({
  obterEstadoDeProntidao,
  cadastrarVeiculo,
  editarVeiculo,
  listarVeiculos,
  registrarVenda,
});

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
