import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { RepositorioVeiculosPostgres } from '../../../src/adapters/outbound/postgres/repositorio-veiculos-postgres';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Preco } from '../../../src/domain/preco';
import { SituacaoVeiculo } from '../../../src/domain/situacao-veiculo';
import { Veiculo } from '../../../src/domain/veiculo';

const urlBancoDados = process.env.TEST_DATABASE_URL ?? '';
const VEICULO_UM = '10000000-0000-4000-8000-000000000001';
const VEICULO_DOIS = '10000000-0000-4000-8000-000000000002';
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');
const DATA_ATUALIZACAO = new Date('2026-10-15T14:30:00.000Z');

function criarVeiculo(
  identificador: string,
  precoAnunciadoCentavos = 7_500_099,
) {
  return Veiculo.cadastrar({
    identificador: IdentificadorVeiculo.criar(identificador),
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: AnoFabricacao.criar(2025, 2026),
    cor: 'Preto',
    precoAnunciado: Preco.criarEmCentavos(precoAnunciadoCentavos),
    cadastradoEm: DATA_CADASTRO,
  });
}

function identificadoresDosVeiculosDaExecucao(veiculos: Veiculo[]) {
  return veiculos
    .map((veiculo) => veiculo.identificador.valor)
    .filter(
      (identificador) =>
        identificador === VEICULO_UM || identificador === VEICULO_DOIS,
    );
}

describe.skipIf(urlBancoDados === '')('RepositorioVeiculosPostgres', () => {
  let pool: Pool;
  let repositorio: RepositorioVeiculosPostgres;

  beforeAll(() => {
    pool = new Pool({ connectionString: urlBancoDados });
    repositorio = new RepositorioVeiculosPostgres(pool);
  });

  afterEach(async () => {
    await pool.query(
      'DELETE FROM historico_veiculos WHERE veiculo_id = ANY($1::uuid[])',
      [[VEICULO_UM, VEICULO_DOIS]],
    );
    await pool.query('DELETE FROM veiculos WHERE id = ANY($1::uuid[])', [
      [VEICULO_UM, VEICULO_DOIS],
    ]);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('persiste o veículo e a data do cadastro', async () => {
    await repositorio.cadastrar(criarVeiculo(VEICULO_UM));

    const resultadoVeiculo = await pool.query<{
      id: string;
      precoAnunciado: string;
      criadoEm: Date;
    }>(
      `
        SELECT
          id,
          preco_anunciado AS "precoAnunciado",
          criado_em AS "criadoEm"
        FROM veiculos
        WHERE id = $1
      `,
      [VEICULO_UM],
    );
    const resultadoHistorico = await pool.query<{
      id: string;
      veiculoId: string;
      tipoEvento: string;
      ocorridoEm: Date;
    }>(
      `
        SELECT
          id,
          veiculo_id AS "veiculoId",
          tipo_evento AS "tipoEvento",
          ocorrido_em AS "ocorridoEm"
        FROM historico_veiculos
        WHERE veiculo_id = $1
      `,
      [VEICULO_UM],
    );

    expect(resultadoVeiculo.rows).toEqual([
      {
        id: VEICULO_UM,
        precoAnunciado: '75000.99',
        criadoEm: DATA_CADASTRO,
      },
    ]);
    expect(resultadoHistorico.rows).toHaveLength(1);
    expect(resultadoHistorico.rows[0]).toEqual({
      id: resultadoHistorico.rows[0]?.id,
      veiculoId: VEICULO_UM,
      tipoEvento: 'VEICULO_CADASTRADO',
      ocorridoEm: DATA_CADASTRO,
    });
    expect(resultadoHistorico.rows[0]?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('busca e reconstrói um veículo pelo identificador', async () => {
    const cadastro = criarVeiculo(VEICULO_UM);
    await repositorio.cadastrar(cadastro);

    const veiculo = await repositorio.buscarPorIdentificador(
      cadastro.identificador,
    );
    const inexistente = await repositorio.buscarPorIdentificador(
      IdentificadorVeiculo.criar(VEICULO_DOIS),
    );

    expect(veiculo).toMatchObject({
      marca: 'Honda',
      modelo: 'Civic',
      cor: 'Preto',
    });
    expect(veiculo?.precoAnunciado.centavos).toBe(7_500_099);
    expect(veiculo?.criadoEm).toEqual(DATA_CADASTRO);
    expect(veiculo?.atualizadoEm).toEqual(DATA_CADASTRO);
    expect(inexistente).toBeNull();
  });

  it('lista veículos por situação em ordem crescente de preço', async () => {
    await repositorio.cadastrar(criarVeiculo(VEICULO_UM, 9_000_000));
    await repositorio.cadastrar(criarVeiculo(VEICULO_DOIS, 7_000_000));

    const disponiveis = await repositorio.listarPorSituacao(
      SituacaoVeiculo.DISPONIVEL,
    );

    expect(identificadoresDosVeiculosDaExecucao(disponiveis)).toEqual([
      VEICULO_DOIS,
      VEICULO_UM,
    ]);

    await pool.query(
      "UPDATE veiculos SET situacao = 'VENDIDO' WHERE id = ANY($1::uuid[])",
      [[VEICULO_UM, VEICULO_DOIS]],
    );

    const vendidos = await repositorio.listarPorSituacao(
      SituacaoVeiculo.VENDIDO,
    );
    const disponiveisAposVenda = await repositorio.listarPorSituacao(
      SituacaoVeiculo.DISPONIVEL,
    );

    expect(identificadoresDosVeiculosDaExecucao(vendidos)).toEqual([
      VEICULO_DOIS,
      VEICULO_UM,
    ]);
    expect(identificadoresDosVeiculosDaExecucao(disponiveisAposVenda)).toEqual(
      [],
    );
  });

  it('atualiza o veículo e registra a data da alteração', async () => {
    const cadastro = criarVeiculo(VEICULO_UM);
    await repositorio.cadastrar(cadastro);
    const veiculoAtualizado = cadastro.editar(
      {
        cor: 'Branco',
        precoAnunciado: Preco.criarEmCentavos(8_000_000),
      },
      DATA_ATUALIZACAO,
    );

    await repositorio.editar(veiculoAtualizado);

    const resultadoVeiculo = await pool.query<{
      cor: string;
      precoAnunciado: string;
      atualizadoEm: Date;
    }>(
      `
        SELECT
          cor,
          preco_anunciado AS "precoAnunciado",
          atualizado_em AS "atualizadoEm"
        FROM veiculos
        WHERE id = $1
      `,
      [VEICULO_UM],
    );
    const resultadoHistorico = await pool.query<{
      tipoEvento: string;
      ocorridoEm: Date;
    }>(
      `
        SELECT
          tipo_evento AS "tipoEvento",
          ocorrido_em AS "ocorridoEm"
        FROM historico_veiculos
        WHERE veiculo_id = $1 AND tipo_evento = 'VEICULO_EDITADO'
      `,
      [VEICULO_UM],
    );

    expect(resultadoVeiculo.rows).toEqual([
      {
        cor: 'Branco',
        precoAnunciado: '80000.00',
        atualizadoEm: DATA_ATUALIZACAO,
      },
    ]);
    expect(resultadoHistorico.rows).toEqual([
      {
        tipoEvento: 'VEICULO_EDITADO',
        ocorridoEm: DATA_ATUALIZACAO,
      },
    ]);
  });
});
