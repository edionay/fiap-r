import requisicao from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { criarAplicacao } from '../../../src/adapters/inbound/http/app';
import { CadastrarVeiculo } from '../../../src/application/veiculos/cadastrar-veiculo';

const IDENTIFICADOR = '550e8400-e29b-41d4-a716-446655440000';
const DATA_ATUAL = new Date('2026-10-14T12:00:00.000Z');

function prepararAplicacao() {
  const cadastrarComHistorico = vi.fn().mockResolvedValue(undefined);
  const cadastrarVeiculo = new CadastrarVeiculo(
    { cadastrarComHistorico },
    { gerar: () => IDENTIFICADOR },
    { agora: () => new Date(DATA_ATUAL) },
  );
  const aplicacao = criarAplicacao({ cadastrarVeiculo });

  return { aplicacao, cadastrarComHistorico };
}

function requisicaoValida() {
  return {
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: 2025,
    cor: 'Preto',
    precoAnunciado: '75000.99',
  };
}

describe('POST /veiculos', () => {
  it('cadastra um veículo e retorna 201', async () => {
    const { aplicacao, cadastrarComHistorico } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post('/veiculos')
      .send(requisicaoValida());

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({
      id: IDENTIFICADOR,
      marca: 'Honda',
      modelo: 'Civic',
      anoFabricacao: 2025,
      cor: 'Preto',
      precoAnunciado: '75000.99',
      situacao: 'DISPONIVEL',
      criadoEm: DATA_ATUAL.toISOString(),
      atualizadoEm: DATA_ATUAL.toISOString(),
    });
    expect(cadastrarComHistorico).toHaveBeenCalledOnce();
  });

  it('completa uma casa decimal sem perder precisão', async () => {
    const { aplicacao } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post('/veiculos')
      .send({
        ...requisicaoValida(),
        precoAnunciado: '75000.9',
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({ precoAnunciado: '75000.90' });
  });

  it('retorna 400 quando falta um campo obrigatório', async () => {
    const corpoIncompleto: Partial<ReturnType<typeof requisicaoValida>> =
      requisicaoValida();
    delete corpoIncompleto.modelo;
    const { aplicacao, cadastrarComHistorico } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post('/veiculos')
      .send(corpoIncompleto);

    expect(resposta.status).toBe(400);
    expect(resposta.body).toMatchObject({
      codigo: 'ERRO_DE_VALIDACAO',
      mensagem: 'A validação da requisição falhou.',
    });
    expect(cadastrarComHistorico).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o ano de fabricação não é inteiro', async () => {
    const { aplicacao, cadastrarComHistorico } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post('/veiculos')
      .send({
        ...requisicaoValida(),
        anoFabricacao: 2025.5,
      });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toMatchObject({ codigo: 'ERRO_DE_VALIDACAO' });
    expect(cadastrarComHistorico).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o preço não usa o formato decimal esperado', async () => {
    const { aplicacao, cadastrarComHistorico } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post('/veiculos')
      .send({
        ...requisicaoValida(),
        precoAnunciado: '75.000,99',
      });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      codigo: 'PRECO_ANUNCIADO_INVALIDO',
      mensagem:
        'O preço anunciado deve ser uma string decimal com até duas casas decimais.',
      detalhes: {
        precoAnunciado:
          'Informe um valor como "75000.99", sem separador de milhares.',
      },
    });
    expect(cadastrarComHistorico).not.toHaveBeenCalled();
  });

  it('retorna 422 quando uma regra do domínio não é atendida', async () => {
    const { aplicacao, cadastrarComHistorico } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post('/veiculos')
      .send({
        ...requisicaoValida(),
        marca: '   ',
      });

    expect(resposta.status).toBe(422);
    expect(resposta.body).toEqual({
      codigo: 'MARCA_OBRIGATORIA',
      mensagem: 'O campo marca é obrigatório.',
    });
    expect(cadastrarComHistorico).not.toHaveBeenCalled();
  });
});
