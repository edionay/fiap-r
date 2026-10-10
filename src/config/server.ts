import { criarAplicacao } from '../adapters/inbound/http/app';
import { obterPorta } from './env';

const porta = obterPorta(process.env.PORT);
const aplicacao = criarAplicacao();

aplicacao.listen(porta, () => {
  console.log(`API de gerenciamento de veículos ouvindo na porta ${String(porta)}.`);
});
