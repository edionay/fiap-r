import requisicao from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { criarAplicacao } from '../../../src/adapters/inbound/http/app';
import { ListarVeiculos } from '../../../src/application/veiculos/listar-veiculos';

describe('Tratamento de erros HTTP', () => {
  it('retorna 400 quando o corpo contém JSON malformado', async () => {
    const resposta = await requisicao(criarAplicacao())
      .post('/veiculos')
      .set('Content-Type', 'application/json')
      .send('{"marca":');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      codigo: 'CORPO_REQUISICAO_INVALIDO',
      mensagem: 'O corpo da requisição deve conter um JSON válido.',
    });
  });

  it('não expõe detalhes de um erro interno', async () => {
    const listarPorSituacao = vi
      .fn()
      .mockRejectedValue(new Error('Detalhe interno do banco de dados.'));
    const listarVeiculos = new ListarVeiculos({ listarPorSituacao });
    const aplicacao = criarAplicacao({ listarVeiculos });

    const resposta = await requisicao(aplicacao)
      .get('/veiculos')
      .query({ situacao: 'DISPONIVEL' });

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      codigo: 'ERRO_INTERNO',
      mensagem: 'Ocorreu um erro inesperado.',
    });
  });
});
