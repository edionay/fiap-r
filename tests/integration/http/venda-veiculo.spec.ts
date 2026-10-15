import requisicao from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { criarAplicacao } from '../../../src/adapters/inbound/http/app';
import { RegistrarVenda } from '../../../src/application/vendas/registrar-venda';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Preco } from '../../../src/domain/preco';
import { SituacaoVeiculo } from '../../../src/domain/situacao-veiculo';
import { Veiculo } from '../../../src/domain/veiculo';

const VEICULO_ID = '550e8400-e29b-41d4-a716-446655440000';
const VENDA_ID = '660e8400-e29b-41d4-a716-446655440000';
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');
const DATA_VENDA = new Date('2026-10-15T14:30:00.000Z');

function criarVeiculo(situacao: SituacaoVeiculo = SituacaoVeiculo.DISPONIVEL) {
  return Veiculo.reconstruir({
    identificador: IdentificadorVeiculo.criar(VEICULO_ID),
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: AnoFabricacao.criar(2025, 2026),
    cor: 'Preto',
    precoAnunciado: Preco.criarEmCentavos(7_500_099),
    situacao,
    criadoEm: DATA_CADASTRO,
    atualizadoEm: DATA_CADASTRO,
  });
}

function prepararAplicacao(veiculo: Veiculo | null = criarVeiculo()) {
  const buscarPorIdentificador = vi.fn().mockResolvedValue(veiculo);
  const registrar = vi.fn().mockResolvedValue(undefined);
  const registrarVenda = new RegistrarVenda(
    {
      cadastrar: vi.fn(),
      buscarPorIdentificador,
      editar: vi.fn(),
    },
    { registrar },
    { gerar: () => VENDA_ID },
  );
  const aplicacao = criarAplicacao({ registrarVenda });

  return { aplicacao, buscarPorIdentificador, registrar };
}

function requisicaoValida() {
  return {
    cpfComprador: '52998224725',
    vendidoEm: DATA_VENDA.toISOString(),
  };
}

describe('POST /veiculos/{veiculoId}/vendas', () => {
  it('registra a venda e retorna 201', async () => {
    const { aplicacao, registrar } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post(`/veiculos/${VEICULO_ID}/vendas`)
      .send(requisicaoValida());

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({
      id: VENDA_ID,
      veiculoId: VEICULO_ID,
      situacao: 'VENDIDO',
      vendidoEm: DATA_VENDA.toISOString(),
    });
    expect(registrar).toHaveBeenCalledOnce();
  });

  it('retorna 400 para um identificador inválido', async () => {
    const { aplicacao, buscarPorIdentificador } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post('/veiculos/identificador-invalido/vendas')
      .send(requisicaoValida());

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      codigo: 'IDENTIFICADOR_VEICULO_INVALIDO',
      mensagem: 'O identificador do veículo deve ser um UUID válido.',
    });
    expect(buscarPorIdentificador).not.toHaveBeenCalled();
  });

  it('retorna 400 quando falta um campo obrigatório', async () => {
    const { aplicacao, buscarPorIdentificador } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post(`/veiculos/${VEICULO_ID}/vendas`)
      .send({ vendidoEm: DATA_VENDA.toISOString() });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toMatchObject({ codigo: 'ERRO_DE_VALIDACAO' });
    expect(buscarPorIdentificador).not.toHaveBeenCalled();
  });

  it('retorna 400 quando a data da venda é inválida', async () => {
    const { aplicacao, buscarPorIdentificador } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post(`/veiculos/${VEICULO_ID}/vendas`)
      .send({ ...requisicaoValida(), vendidoEm: 'data-invalida' });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toMatchObject({ codigo: 'ERRO_DE_VALIDACAO' });
    expect(buscarPorIdentificador).not.toHaveBeenCalled();
  });

  it('retorna 404 quando o veículo não existe', async () => {
    const { aplicacao, registrar } = prepararAplicacao(null);

    const resposta = await requisicao(aplicacao)
      .post(`/veiculos/${VEICULO_ID}/vendas`)
      .send(requisicaoValida());

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      codigo: 'VEICULO_NAO_ENCONTRADO',
      mensagem: 'O veículo informado não foi encontrado.',
    });
    expect(registrar).not.toHaveBeenCalled();
  });

  it('retorna 409 quando o veículo já foi vendido', async () => {
    const { aplicacao, registrar } = prepararAplicacao(
      criarVeiculo(SituacaoVeiculo.VENDIDO),
    );

    const resposta = await requisicao(aplicacao)
      .post(`/veiculos/${VEICULO_ID}/vendas`)
      .send(requisicaoValida());

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      codigo: 'VEICULO_JA_VENDIDO',
      mensagem: 'O veículo informado já foi vendido.',
    });
    expect(registrar).not.toHaveBeenCalled();
  });

  it('retorna 422 quando o CPF é inválido', async () => {
    const { aplicacao, buscarPorIdentificador } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .post(`/veiculos/${VEICULO_ID}/vendas`)
      .send({ ...requisicaoValida(), cpfComprador: '12345678900' });

    expect(resposta.status).toBe(422);
    expect(resposta.body).toEqual({
      codigo: 'CPF_INVALIDO',
      mensagem: 'O CPF do comprador deve ser válido e conter 11 dígitos.',
    });
    expect(buscarPorIdentificador).not.toHaveBeenCalled();
  });
});
