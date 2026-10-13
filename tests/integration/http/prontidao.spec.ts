import requisicao from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { criarAplicacao } from '../../../src/adapters/inbound/http/app';
import { ObterEstadoDeProntidao } from '../../../src/application/saude/obter-estado-de-prontidao';

describe('GET /ready', () => {
  it('retorna 200 quando o banco de dados está pronto', async () => {
    const aplicacao = criarAplicacao({
      obterEstadoDeProntidao: new ObterEstadoDeProntidao({
        estaPronto: vi.fn().mockResolvedValue(true),
      }),
    });

    const resposta = await requisicao(aplicacao).get('/ready');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ready' });
  });

  it('retorna 503 quando o banco de dados não está pronto', async () => {
    const aplicacao = criarAplicacao({
      obterEstadoDeProntidao: new ObterEstadoDeProntidao({
        estaPronto: vi.fn().mockResolvedValue(false),
      }),
    });

    const resposta = await requisicao(aplicacao).get('/ready');

    expect(resposta.status).toBe(503);
    expect(resposta.body).toEqual({ status: 'not_ready' });
  });
});
