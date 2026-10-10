import express, { type Express } from 'express';
import { RegisterRoutes } from './generated/routes';
import {
  tratadorDeErros,
  tratadorDeRotaNaoEncontrada,
} from './middlewares/tratador-de-erros';

export function criarAplicacao(): Express {
  const aplicacao = express();

  aplicacao.disable('x-powered-by');
  aplicacao.use(express.json({ limit: '1mb' }));

  RegisterRoutes(aplicacao);

  aplicacao.use(tratadorDeRotaNaoEncontrada);
  aplicacao.use(tratadorDeErros);

  return aplicacao;
}
