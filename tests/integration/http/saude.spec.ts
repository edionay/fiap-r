import requisicao from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarAplicacao } from '../../../src/adapters/inbound/http/app';

describe('GET /health', () => {
  it('retorna o estado de saúde da API', async () => {
    const resposta = await requisicao(criarAplicacao()).get('/health');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok' });
  });

  it('retorna erro em português quando a rota não existe', async () => {
    const resposta = await requisicao(criarAplicacao()).get('/rota-inexistente');

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      codigo: 'ROTA_NAO_ENCONTRADA',
      mensagem: 'Rota não encontrada.',
    });
  });
});
