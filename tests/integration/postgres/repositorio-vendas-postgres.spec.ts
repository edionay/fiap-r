import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { RepositorioVeiculosPostgres } from '../../../src/adapters/outbound/postgres/repositorio-veiculos-postgres';
import { RepositorioVendasPostgres } from '../../../src/adapters/outbound/postgres/repositorio-vendas-postgres';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { Cpf } from '../../../src/domain/cpf';
import { ErroDominio } from '../../../src/domain/erro-dominio';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Preco } from '../../../src/domain/preco';
import { Veiculo } from '../../../src/domain/veiculo';
import { Venda } from '../../../src/domain/venda';

const urlBancoDados = process.env.TEST_DATABASE_URL ?? '';
const VEICULO_ID = '30000000-0000-4000-8000-000000000001';
const VENDA_UM = '40000000-0000-4000-8000-000000000001';
const VENDA_DOIS = '40000000-0000-4000-8000-000000000002';
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');
const DATA_VENDA = new Date('2026-10-15T14:30:00.000Z');

function criarVeiculo() {
  return Veiculo.cadastrar({
    identificador: IdentificadorVeiculo.criar(VEICULO_ID),
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: AnoFabricacao.criar(2025, 2026),
    cor: 'Preto',
    precoAnunciado: Preco.criarEmCentavos(7_500_099),
    cadastradoEm: DATA_CADASTRO,
  });
}

function criarVenda(identificador: string) {
  return Venda.registrar({
    identificador,
    veiculoId: IdentificadorVeiculo.criar(VEICULO_ID),
    cpfComprador: Cpf.criar('52998224725'),
    vendidoEm: DATA_VENDA,
  });
}

describe.skipIf(urlBancoDados === '')('RepositorioVendasPostgres', () => {
  let pool: Pool;
  let repositorioVeiculos: RepositorioVeiculosPostgres;
  let repositorioVendas: RepositorioVendasPostgres;

  beforeAll(() => {
    pool = new Pool({ connectionString: urlBancoDados });
    repositorioVeiculos = new RepositorioVeiculosPostgres(pool);
    repositorioVendas = new RepositorioVendasPostgres(pool);
  });

  afterEach(async () => {
    await pool.query('DELETE FROM historico_veiculos WHERE veiculo_id = $1', [
      VEICULO_ID,
    ]);
    await pool.query('DELETE FROM vendas WHERE veiculo_id = $1', [VEICULO_ID]);
    await pool.query('DELETE FROM veiculos WHERE id = $1', [VEICULO_ID]);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('registra a venda, atualiza o veículo e registra a data', async () => {
    const veiculo = criarVeiculo();
    await repositorioVeiculos.cadastrar(veiculo);
    const veiculoVendido = veiculo.vender(DATA_VENDA);
    const venda = criarVenda(VENDA_UM);

    await repositorioVendas.registrar(venda, veiculoVendido);

    const resultado = await pool.query<{
      situacao: string;
      atualizadoEm: Date;
      cpfComprador: string;
      precoVenda: string;
      vendidoEm: Date;
      ocorridoEm: Date;
    }>(
      `
        SELECT
          v.situacao,
          v.atualizado_em AS "atualizadoEm",
          vd.cpf_comprador AS "cpfComprador",
          vd.preco_venda AS "precoVenda",
          vd.vendido_em AS "vendidoEm",
          h.ocorrido_em AS "ocorridoEm"
        FROM veiculos v
        JOIN vendas vd ON vd.veiculo_id = v.id
        JOIN historico_veiculos h
          ON h.veiculo_id = v.id AND h.tipo_evento = 'VEICULO_VENDIDO'
        WHERE v.id = $1
      `,
      [VEICULO_ID],
    );

    expect(resultado.rows).toEqual([
      {
        situacao: 'VENDIDO',
        atualizadoEm: DATA_VENDA,
        cpfComprador: '52998224725',
        precoVenda: '75000.99',
        vendidoEm: DATA_VENDA,
        ocorridoEm: DATA_VENDA,
      },
    ]);
  });

  it('impede uma segunda venda do mesmo veículo', async () => {
    const veiculo = criarVeiculo();
    await repositorioVeiculos.cadastrar(veiculo);
    const veiculoVendido = veiculo.vender(DATA_VENDA);
    await repositorioVendas.registrar(
      criarVenda(VENDA_UM),
      veiculoVendido,
    );

    await expect(
      repositorioVendas.registrar(criarVenda(VENDA_DOIS), veiculoVendido),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ErroDominio>>({
        codigo: 'VEICULO_JA_VENDIDO',
      }),
    );

    const resultado = await pool.query<{ quantidade: number }>(
      'SELECT COUNT(*)::integer AS quantidade FROM vendas WHERE veiculo_id = $1',
      [VEICULO_ID],
    );
    expect(resultado.rows[0]?.quantidade).toBe(1);
  });
});
