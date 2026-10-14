import express, { type Express } from 'express';
import type { ObterEstadoDeProntidao } from '../../../application/saude/obter-estado-de-prontidao';
import type { CadastrarVeiculo } from '../../../application/veiculos/cadastrar-veiculo';
import { RegisterRoutes } from './generated/routes';
import {
  tratadorDeErros,
  tratadorDeRotaNaoEncontrada,
} from './middlewares/tratador-de-erros';

export interface DependenciasAplicacao {
  obterEstadoDeProntidao: ObterEstadoDeProntidao;
  cadastrarVeiculo: CadastrarVeiculo;
}

export function criarAplicacao(
  dependencias: Partial<DependenciasAplicacao> = {},
): Express {
  const aplicacao = express();

  aplicacao.locals.dependencias = dependencias;

  aplicacao.disable('x-powered-by');
  aplicacao.use(express.json({ limit: '1mb' }));

  RegisterRoutes(aplicacao);

  aplicacao.use(tratadorDeRotaNaoEncontrada);
  aplicacao.use(tratadorDeErros);

  return aplicacao;
}
