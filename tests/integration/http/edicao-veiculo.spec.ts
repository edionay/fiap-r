import requisicao from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { criarAplicacao } from '../../../src/adapters/inbound/http/app';
import { EditarVeiculo } from '../../../src/application/veiculos/editar-veiculo';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Preco } from '../../../src/domain/preco';
import { SituacaoVeiculo } from '../../../src/domain/situacao-veiculo';
import { Veiculo } from '../../../src/domain/veiculo';

const IDENTIFICADOR = '550e8400-e29b-41d4-a716-446655440000';
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');
const DATA_ATUALIZACAO = new Date('2026-10-15T14:30:00.000Z');

function criarVeiculo() {
  return Veiculo.reconstruir({
    identificador: IdentificadorVeiculo.criar(IDENTIFICADOR),
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: AnoFabricacao.criar(2025, 2026),
    cor: 'Preto',
    precoAnunciado: Preco.criarEmCentavos(7_500_099),
    situacao: SituacaoVeiculo.DISPONIVEL,
    criadoEm: DATA_CADASTRO,
    atualizadoEm: DATA_CADASTRO,
  });
}

function prepararAplicacao(veiculo: Veiculo | null = criarVeiculo()) {
  const buscarPorIdentificador = vi.fn().mockResolvedValue(veiculo);
  const editar = vi.fn().mockResolvedValue(undefined);
  const editarVeiculo = new EditarVeiculo(
    { cadastrar: vi.fn(), buscarPorIdentificador, editar },
    { agora: () => new Date(DATA_ATUALIZACAO) },
  );
  const aplicacao = criarAplicacao({ editarVeiculo });

  return { aplicacao, buscarPorIdentificador, editar };
}

describe('PATCH /veiculos/{veiculoId}', () => {
  it('edita os campos informados e retorna 200', async () => {
    const { aplicacao, editar } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({ cor: 'Branco', precoAnunciado: '80000.9' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      id: IDENTIFICADOR,
      marca: 'Honda',
      modelo: 'Civic',
      anoFabricacao: 2025,
      cor: 'Branco',
      precoAnunciado: '80000.90',
      situacao: 'DISPONIVEL',
      criadoEm: DATA_CADASTRO.toISOString(),
      atualizadoEm: DATA_ATUALIZACAO.toISOString(),
    });
    expect(editar).toHaveBeenCalledOnce();
  });

  it('retorna 400 para um identificador inválido', async () => {
    const { aplicacao, buscarPorIdentificador } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .patch('/veiculos/identificador-invalido')
      .send({ cor: 'Branco' });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      codigo: 'IDENTIFICADOR_VEICULO_INVALIDO',
      mensagem: 'O identificador do veículo deve ser um UUID válido.',
    });
    expect(buscarPorIdentificador).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o preço não usa o formato decimal esperado', async () => {
    const { aplicacao, buscarPorIdentificador } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({ precoAnunciado: '80.000,00' });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toMatchObject({
      codigo: 'PRECO_ANUNCIADO_INVALIDO',
    });
    expect(buscarPorIdentificador).not.toHaveBeenCalled();
  });

  it('retorna 404 quando o veículo não existe', async () => {
    const { aplicacao, editar } = prepararAplicacao(null);

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({ cor: 'Branco' });

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      codigo: 'VEICULO_NAO_ENCONTRADO',
      mensagem: 'O veículo informado não foi encontrado.',
    });
    expect(editar).not.toHaveBeenCalled();
  });

  it('retorna 422 quando um campo informado viola uma regra do domínio', async () => {
    const { aplicacao, editar } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({ marca: '   ' });

    expect(resposta.status).toBe(422);
    expect(resposta.body).toEqual({
      codigo: 'MARCA_OBRIGATORIA',
      mensagem: 'O campo marca é obrigatório.',
    });
    expect(editar).not.toHaveBeenCalled();
  });
});
