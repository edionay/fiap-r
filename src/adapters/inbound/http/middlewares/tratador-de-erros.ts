import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ValidateError } from '@tsoa/runtime';
import { ErroAplicacao } from '../../../../application/erro-aplicacao';
import { ErroDominio } from '../../../../domain/erro-dominio';
import { ErroRequisicao } from '../erro-requisicao';

const STATUS_ERROS_APLICACAO: Readonly<Record<string, number>> = {
  VEICULO_NAO_ENCONTRADO: 404,
};

const STATUS_ERROS_DOMINIO: Readonly<Record<string, number>> = {
  IDENTIFICADOR_VEICULO_INVALIDO: 400,
};

export interface RespostaDeErro {
  codigo: string;
  mensagem: string;
  detalhes?: unknown;
}

export const tratadorDeRotaNaoEncontrada: RequestHandler = (
  _requisicao,
  resposta,
) => {
  const corpo: RespostaDeErro = {
    codigo: 'ROTA_NAO_ENCONTRADA',
    mensagem: 'Rota não encontrada.',
  };

  resposta.status(404).json(corpo);
};

export const tratadorDeErros: ErrorRequestHandler = (
  erro: unknown,
  _requisicao,
  resposta,
  _proximo,
) => {
  if (erro instanceof ValidateError) {
    const corpo: RespostaDeErro = {
      codigo: 'ERRO_DE_VALIDACAO',
      mensagem: 'A validação da requisição falhou.',
      detalhes: erro.fields,
    };

    resposta.status(400).json(corpo);
    return;
  }

  if (erro instanceof ErroRequisicao) {
    const corpo: RespostaDeErro = {
      codigo: erro.codigo,
      mensagem: erro.message,
      ...(erro.detalhes === undefined ? {} : { detalhes: erro.detalhes }),
    };

    resposta.status(400).json(corpo);
    return;
  }

  if (erro instanceof ErroAplicacao) {
    const corpo: RespostaDeErro = {
      codigo: erro.codigo,
      mensagem: erro.message,
    };
    const status = STATUS_ERROS_APLICACAO[erro.codigo] ?? 500;

    resposta.status(status).json(corpo);
    return;
  }

  if (erro instanceof ErroDominio) {
    const corpo: RespostaDeErro = {
      codigo: erro.codigo,
      mensagem: erro.message,
    };

    const status = STATUS_ERROS_DOMINIO[erro.codigo] ?? 422;

    resposta.status(status).json(corpo);
    return;
  }

  const corpo: RespostaDeErro = {
    codigo: 'ERRO_INTERNO',
    mensagem: 'Ocorreu um erro inesperado.',
  };

  resposta.status(500).json(corpo);
};
