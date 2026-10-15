import { describe, expect, it, vi } from 'vitest';
import { ErroAplicacao } from '../../../../src/application/erro-aplicacao';
import { RegistrarVenda } from '../../../../src/application/vendas/registrar-venda';
import { AnoFabricacao } from '../../../../src/domain/ano-fabricacao';
import { ErroDominio } from '../../../../src/domain/erro-dominio';
import { IdentificadorVeiculo } from '../../../../src/domain/identificador-veiculo';
import { Preco } from '../../../../src/domain/preco';
import { SituacaoVeiculo } from '../../../../src/domain/situacao-veiculo';
import { Veiculo } from '../../../../src/domain/veiculo';

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
    precoAnunciado: Preco.criarEmCentavos(7_500_000),
    situacao,
    criadoEm: DATA_CADASTRO,
    atualizadoEm: DATA_CADASTRO,
  });
}

function prepararCasoDeUso(veiculo: Veiculo | null = criarVeiculo()) {
  const repositorioVeiculos = {
    cadastrar: vi.fn(),
    buscarPorIdentificador: vi.fn().mockResolvedValue(veiculo),
    editar: vi.fn(),
  };
  const repositorioVendas = {
    registrar: vi.fn().mockResolvedValue(undefined),
  };
  const geradorIdentificadores = {
    gerar: vi.fn().mockReturnValue(VENDA_ID),
  };
  const casoDeUso = new RegistrarVenda(
    repositorioVeiculos,
    repositorioVendas,
    geradorIdentificadores,
  );

  return {
    casoDeUso,
    geradorIdentificadores,
    repositorioVeiculos,
    repositorioVendas,
  };
}

function dadosValidos() {
  return {
    veiculoId: VEICULO_ID,
    cpfComprador: '52998224725',
    vendidoEm: DATA_VENDA,
  };
}

describe('RegistrarVenda', () => {
  it('registra a venda e retorna o veículo vendido', async () => {
    const { casoDeUso, repositorioVendas } = prepararCasoDeUso();

    const resultado = await casoDeUso.executar(dadosValidos());

    expect(resultado).toEqual({
      identificador: VENDA_ID,
      veiculoId: VEICULO_ID,
      situacaoVeiculo: SituacaoVeiculo.VENDIDO,
      vendidoEm: DATA_VENDA,
    });
    expect(repositorioVendas.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        identificador: VENDA_ID,
      }),
      expect.objectContaining({
        situacao: SituacaoVeiculo.VENDIDO,
        atualizadoEm: DATA_VENDA,
      }),
    );
  });

  it('rejeita a venda quando o veículo não existe', async () => {
    const { casoDeUso, geradorIdentificadores, repositorioVendas } =
      prepararCasoDeUso(null);

    await expect(casoDeUso.executar(dadosValidos())).rejects.toEqual(
      expect.objectContaining<Partial<ErroAplicacao>>({
        codigo: 'VEICULO_NAO_ENCONTRADO',
      }),
    );
    expect(geradorIdentificadores.gerar).not.toHaveBeenCalled();
    expect(repositorioVendas.registrar).not.toHaveBeenCalled();
  });

  it('rejeita um CPF inválido antes de buscar o veículo', async () => {
    const { casoDeUso, repositorioVeiculos, repositorioVendas } =
      prepararCasoDeUso();

    await expect(
      casoDeUso.executar({ ...dadosValidos(), cpfComprador: '12345678900' }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ErroDominio>>({ codigo: 'CPF_INVALIDO' }),
    );
    expect(repositorioVeiculos.buscarPorIdentificador).not.toHaveBeenCalled();
    expect(repositorioVendas.registrar).not.toHaveBeenCalled();
  });

  it('rejeita a venda quando o veículo já foi vendido', async () => {
    const { casoDeUso, repositorioVendas } = prepararCasoDeUso(
      criarVeiculo(SituacaoVeiculo.VENDIDO),
    );

    await expect(casoDeUso.executar(dadosValidos())).rejects.toEqual(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'VEICULO_JA_VENDIDO',
      }),
    );
    expect(repositorioVendas.registrar).not.toHaveBeenCalled();
  });
});
