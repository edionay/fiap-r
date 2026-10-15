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

function criarVeiculo(situacao: SituacaoVeiculo = SituacaoVeiculo.DISPONIVEL) {
  return Veiculo.reconstruir({
    identificador: IdentificadorVeiculo.criar(IDENTIFICADOR),
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

function prepararAplicacao(
  veiculo: Veiculo | null = criarVeiculo(),
  edicaoRealizada = true,
) {
  const buscarPorIdentificador = vi.fn().mockResolvedValue(veiculo);
  const editarComHistorico = vi.fn().mockResolvedValue(edicaoRealizada);
  const editarVeiculo = new EditarVeiculo(
    { buscarPorIdentificador, editarComHistorico },
    { agora: () => new Date(DATA_ATUALIZACAO) },
  );
  const aplicacao = criarAplicacao({ editarVeiculo });

  return {
    aplicacao,
    buscarPorIdentificador,
    editarComHistorico,
  };
}

describe('PATCH /veiculos/{veiculoId}', () => {
  it('edita os campos informados e retorna 200', async () => {
    const { aplicacao, editarComHistorico } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({
        cor: 'Branco',
        precoAnunciado: '80000.9',
      });

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
    expect(editarComHistorico).toHaveBeenCalledOnce();
  });

  it('retorna o estado atual sem persistir quando nada muda', async () => {
    const { aplicacao, editarComHistorico } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({ cor: ' Preto ' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      cor: 'Preto',
      atualizadoEm: DATA_CADASTRO.toISOString(),
    });
    expect(editarComHistorico).not.toHaveBeenCalled();
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
    const { aplicacao, editarComHistorico } = prepararAplicacao(null);

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({ cor: 'Branco' });

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      codigo: 'VEICULO_NAO_ENCONTRADO',
      mensagem: 'O veículo informado não foi encontrado.',
    });
    expect(editarComHistorico).not.toHaveBeenCalled();
  });

  it('retorna 409 quando o veículo está vendido', async () => {
    const { aplicacao, editarComHistorico } = prepararAplicacao(
      criarVeiculo(SituacaoVeiculo.VENDIDO),
    );

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({ cor: 'Branco' });

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      codigo: 'VEICULO_NAO_DISPONIVEL',
      mensagem: 'Somente veículos disponíveis podem ser editados.',
    });
    expect(editarComHistorico).not.toHaveBeenCalled();
  });

  it('retorna 409 quando outra operação alterou o veículo', async () => {
    const { aplicacao, editarComHistorico } = prepararAplicacao(
      criarVeiculo(),
      false,
    );

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({ cor: 'Branco' });

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      codigo: 'VEICULO_ALTERADO_CONCORRENTEMENTE',
      mensagem: 'O veículo foi alterado por outra operação.',
    });
    expect(editarComHistorico).toHaveBeenCalledOnce();
  });

  it('retorna 422 quando um campo informado viola uma regra do domínio', async () => {
    const { aplicacao, editarComHistorico } = prepararAplicacao();

    const resposta = await requisicao(aplicacao)
      .patch(`/veiculos/${IDENTIFICADOR}`)
      .send({ marca: '   ' });

    expect(resposta.status).toBe(422);
    expect(resposta.body).toEqual({
      codigo: 'MARCA_OBRIGATORIA',
      mensagem: 'O campo marca é obrigatório.',
    });
    expect(editarComHistorico).not.toHaveBeenCalled();
  });
});
