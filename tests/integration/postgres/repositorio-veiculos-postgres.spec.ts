import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { RepositorioVeiculosPostgres } from '../../../src/adapters/outbound/postgres/repositorio-veiculos-postgres';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Preco } from '../../../src/domain/preco';
import { Veiculo } from '../../../src/domain/veiculo';

const urlBancoDados = process.env.TEST_DATABASE_URL ?? '';
const VEICULO_UM = '10000000-0000-4000-8000-000000000001';
const VEICULO_DOIS = '10000000-0000-4000-8000-000000000002';
const HISTORICO = '20000000-0000-4000-8000-000000000001';
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');

function criarCadastro(identificador: string) {
  return Veiculo.cadastrar({
    identificador: IdentificadorVeiculo.criar(identificador),
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: AnoFabricacao.criar(2025, 2026),
    cor: 'Preto',
    precoAnunciado: Preco.criarEmCentavos(7_500_099),
    cadastradoEm: DATA_CADASTRO,
  });
}

describe.skipIf(urlBancoDados === '')(
  'RepositorioVeiculosPostgres',
  () => {
    let pool: Pool;

    beforeAll(() => {
      pool = new Pool({ connectionString: urlBancoDados });
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

    it('persiste o veículo e o histórico na mesma operação', async () => {
      const repositorio = new RepositorioVeiculosPostgres(pool, {
        gerar: () => HISTORICO,
      });
      const { veiculo, evento } = criarCadastro(VEICULO_UM);

      await repositorio.cadastrarComHistorico(veiculo, evento);

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
        alteracoes: unknown;
        ocorridoEm: Date;
      }>(
        `
          SELECT
            id,
            veiculo_id AS "veiculoId",
            tipo_evento AS "tipoEvento",
            alteracoes,
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
      expect(resultadoHistorico.rows).toEqual([
        {
          id: HISTORICO,
          veiculoId: VEICULO_UM,
          tipoEvento: 'VEICULO_CADASTRADO',
          alteracoes: evento.dados,
          ocorridoEm: DATA_CADASTRO,
        },
      ]);
    });

    it('desfaz o veículo quando a gravação do histórico falha', async () => {
      const repositorio = new RepositorioVeiculosPostgres(pool, {
        gerar: () => HISTORICO,
      });
      const primeiroCadastro = criarCadastro(VEICULO_UM);
      const segundoCadastro = criarCadastro(VEICULO_DOIS);
      await repositorio.cadastrarComHistorico(
        primeiroCadastro.veiculo,
        primeiroCadastro.evento,
      );

      await expect(
        repositorio.cadastrarComHistorico(
          segundoCadastro.veiculo,
          segundoCadastro.evento,
        ),
      ).rejects.toThrow();

      const resultado = await pool.query<{ quantidade: number }>(
        'SELECT COUNT(*)::integer AS quantidade FROM veiculos WHERE id = $1',
        [VEICULO_DOIS],
      );

      expect(resultado.rows[0]?.quantidade).toBe(0);
    });
  },
);
