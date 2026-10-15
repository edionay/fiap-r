import requisicao from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { criarAplicacao } from '../../../src/adapters/inbound/http/app';
import { ListarVeiculos } from '../../../src/application/veiculos/listar-veiculos';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Preco } from '../../../src/domain/preco';
import { SituacaoVeiculo } from '../../../src/domain/situacao-veiculo';
import { Veiculo } from '../../../src/domain/veiculo';

const IDENTIFICADOR = '550e8400-e29b-41d4-a716-446655440000';
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');

function criarVeiculo(situacao: SituacaoVeiculo) {
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

function prepararAplicacao(situacao: SituacaoVeiculo) {
  const listarPorSituacao = vi
    .fn()
    .mockResolvedValue([criarVeiculo(situacao)]);
  const listarVeiculos = new ListarVeiculos({ listarPorSituacao });
  const aplicacao = criarAplicacao({ listarVeiculos });

  return { aplicacao, listarPorSituacao };
}

describe('GET /veiculos', () => {
  it.each([SituacaoVeiculo.DISPONIVEL, SituacaoVeiculo.VENDIDO])(
    'lista veículos com situação %s',
    async (situacao) => {
      const { aplicacao, listarPorSituacao } = prepararAplicacao(situacao);

      const resposta = await requisicao(aplicacao)
        .get('/veiculos')
        .query({ situacao });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([
        {
          id: IDENTIFICADOR,
          marca: 'Honda',
          modelo: 'Civic',
          anoFabricacao: 2025,
          cor: 'Preto',
          precoAnunciado: '75000.99',
          situacao,
          criadoEm: DATA_CADASTRO.toISOString(),
          atualizadoEm: DATA_CADASTRO.toISOString(),
        },
      ]);
      expect(listarPorSituacao).toHaveBeenCalledWith(situacao);
    },
  );

  it('retorna 400 quando a situação não é informada', async () => {
    const { aplicacao, listarPorSituacao } = prepararAplicacao(
      SituacaoVeiculo.DISPONIVEL,
    );

    const resposta = await requisicao(aplicacao).get('/veiculos');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toMatchObject({ codigo: 'ERRO_DE_VALIDACAO' });
    expect(listarPorSituacao).not.toHaveBeenCalled();
  });

  it('retorna 400 quando a situação é inválida', async () => {
    const { aplicacao, listarPorSituacao } = prepararAplicacao(
      SituacaoVeiculo.DISPONIVEL,
    );

    const resposta = await requisicao(aplicacao)
      .get('/veiculos')
      .query({ situacao: 'RESERVADO' });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toMatchObject({ codigo: 'ERRO_DE_VALIDACAO' });
    expect(listarPorSituacao).not.toHaveBeenCalled();
  });
});
