import express, { type Express } from 'express';
import type { ObterEstadoDeProntidao } from '../../../application/saude/obter-estado-de-prontidao';
import type { CadastrarVeiculo } from '../../../application/veiculos/cadastrar-veiculo';
import type { EditarVeiculo } from '../../../application/veiculos/editar-veiculo';
import type { ListarVeiculos } from '../../../application/veiculos/listar-veiculos';
import type { RegistrarVenda } from '../../../application/vendas/registrar-venda';
import { RegisterRoutes } from './generated/routes';
import {
  type EspecificacaoOpenApi,
  registrarDocumentacaoApi,
} from './documentacao-api';
import {
  tratadorDeErros,
  tratadorDeRotaNaoEncontrada,
} from './middlewares/tratador-de-erros';

export interface DependenciasAplicacao {
  obterEstadoDeProntidao: ObterEstadoDeProntidao;
  cadastrarVeiculo: CadastrarVeiculo;
  editarVeiculo: EditarVeiculo;
  listarVeiculos: ListarVeiculos;
  registrarVenda: RegistrarVenda;
}

export function criarAplicacao(
  dependencias: Partial<DependenciasAplicacao> = {},
  especificacaoOpenApi?: EspecificacaoOpenApi,
): Express {
  const aplicacao = express();

  aplicacao.locals.dependencias = dependencias;

  aplicacao.disable('x-powered-by');
  aplicacao.use(express.json({ limit: '1mb' }));

  if (especificacaoOpenApi !== undefined) {
    registrarDocumentacaoApi(aplicacao, especificacaoOpenApi);
  }

  RegisterRoutes(aplicacao);

  aplicacao.use(tratadorDeRotaNaoEncontrada);
  aplicacao.use(tratadorDeErros);

  return aplicacao;
}
