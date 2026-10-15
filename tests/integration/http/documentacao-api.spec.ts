import requisicao from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarAplicacao } from '../../../src/adapters/inbound/http/app';
import type { EspecificacaoOpenApi } from '../../../src/adapters/inbound/http/documentacao-api';

const especificacao: EspecificacaoOpenApi = {
  openapi: '3.0.0',
  info: {
    title: 'API de Gerenciamento de Veículos',
    version: '0.1.0',
  },
  paths: {
    '/health': {},
  },
};

describe('Documentação da API', () => {
  it('disponibiliza a especificação OpenAPI em JSON', async () => {
    const resposta = await requisicao(
      criarAplicacao({}, especificacao),
    ).get('/openapi.json');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(especificacao);
  });

  it('disponibiliza a interface do Swagger UI', async () => {
    const resposta = await requisicao(
      criarAplicacao({}, especificacao),
    ).get('/docs/');

    expect(resposta.status).toBe(200);
    expect(resposta.type).toBe('text/html');
    expect(resposta.text).toContain(
      '<title>Documentação da API de Gestão de Veículos</title>',
    );
  });
});
