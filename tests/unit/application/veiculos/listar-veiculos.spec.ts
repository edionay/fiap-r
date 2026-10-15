import { describe, expect, it, vi } from 'vitest';
import { ListarVeiculos } from '../../../../src/application/veiculos/listar-veiculos';
import { AnoFabricacao } from '../../../../src/domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../../../src/domain/identificador-veiculo';
import { Preco } from '../../../../src/domain/preco';
import { SituacaoVeiculo } from '../../../../src/domain/situacao-veiculo';
import { Veiculo } from '../../../../src/domain/veiculo';

const IDENTIFICADOR = '550e8400-e29b-41d4-a716-446655440000';
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');

function criarVeiculo(situacao: SituacaoVeiculo) {
  const veiculo = Veiculo.cadastrar({
    identificador: IdentificadorVeiculo.criar(IDENTIFICADOR),
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: AnoFabricacao.criar(2025, 2026),
    cor: 'Preto',
    precoAnunciado: Preco.criarEmCentavos(7_500_000),
    cadastradoEm: DATA_CADASTRO,
  });

  return situacao === SituacaoVeiculo.VENDIDO
    ? veiculo.vender(DATA_CADASTRO)
    : veiculo;
}

describe('ListarVeiculos', () => {
  it.each([SituacaoVeiculo.DISPONIVEL, SituacaoVeiculo.VENDIDO])(
    'lista os veículos com situação %s',
    async (situacao) => {
      const veiculo = criarVeiculo(situacao);
      const listarPorSituacao = vi.fn().mockResolvedValue([veiculo]);
      const casoDeUso = new ListarVeiculos({ listarPorSituacao });

      const resultado = await casoDeUso.executar(situacao);

      expect(listarPorSituacao).toHaveBeenCalledWith(situacao);
      expect(resultado).toEqual([
        {
          identificador: IDENTIFICADOR,
          marca: 'Honda',
          modelo: 'Civic',
          anoFabricacao: 2025,
          cor: 'Preto',
          precoAnunciadoCentavos: 7_500_000,
          situacao,
          criadoEm: DATA_CADASTRO,
          atualizadoEm: DATA_CADASTRO,
        },
      ]);
    },
  );
});
