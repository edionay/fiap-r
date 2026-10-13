import express, { type Express } from 'express';
import type { ObterEstadoDeProntidao } from '../../../application/saude/obter-estado-de-prontidao';
import { RegisterRoutes } from './generated/routes';
import {
  tratadorDeErros,
  tratadorDeRotaNaoEncontrada,
} from './middlewares/tratador-de-erros';

export interface DependenciasAplicacao {
  obterEstadoDeProntidao: ObterEstadoDeProntidao;
}

export function criarAplicacao(
  dependencias?: DependenciasAplicacao,
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
