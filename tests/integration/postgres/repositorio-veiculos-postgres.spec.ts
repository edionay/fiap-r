import { Pool } from 'pg';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { RepositorioVeiculosPostgres } from '../../../src/adapters/outbound/postgres/repositorio-veiculos-postgres';
import { AnoFabricacao } from '../../../src/domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../../src/domain/identificador-veiculo';
import { Preco } from '../../../src/domain/preco';
import { Veiculo } from '../../../src/domain/veiculo';

const urlBancoDados = process.env.TEST_DATABASE_URL ?? '';
const VEICULO_UM = '10000000-0000-4000-8000-000000000001';
const VEICULO_DOIS = '10000000-0000-4000-8000-000000000002';
const HISTORICO = '20000000-0000-4000-8000-000000000001';
const HISTORICO_EDICAO = '20000000-0000-4000-8000-000000000002';
const DATA_CADASTRO = new Date('2026-10-14T12:00:00.000Z');
const DATA_ATUALIZACAO = new Date('2026-10-15T14:30:00.000Z');
const DATA_OUTRA_ATUALIZACAO = new Date('2026-10-16T10:00:00.000Z');

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

    it('busca e reconstrói um veículo pelo identificador', async () => {
      const repositorio = new RepositorioVeiculosPostgres(pool, {
        gerar: () => HISTORICO,
      });
      const cadastro = criarCadastro(VEICULO_UM);
      await repositorio.cadastrarComHistorico(
        cadastro.veiculo,
        cadastro.evento,
      );

      const veiculo = await repositorio.buscarPorIdentificador(
        IdentificadorVeiculo.criar(VEICULO_UM),
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

    it('edita o veículo e registra o histórico na mesma transação', async () => {
      const gerarIdentificador = vi
        .fn()
        .mockReturnValueOnce(HISTORICO)
        .mockReturnValue(HISTORICO_EDICAO);
      const repositorio = new RepositorioVeiculosPostgres(pool, {
        gerar: gerarIdentificador,
      });
      const cadastro = criarCadastro(VEICULO_UM);
      await repositorio.cadastrarComHistorico(
        cadastro.veiculo,
        cadastro.evento,
      );
      const veiculo = await repositorio.buscarPorIdentificador(
        cadastro.veiculo.identificador,
      );

      expect(veiculo).not.toBeNull();
      if (veiculo === null) {
        throw new Error('O veículo deveria ter sido encontrado.');
      }

      const atualizadoEmEsperado = veiculo.atualizadoEm;
      const edicao = veiculo.editar(
        {
          cor: 'Branco',
          precoAnunciado: Preco.criarEmCentavos(8_000_000),
        },
        DATA_ATUALIZACAO,
      );

      expect(edicao.evento).not.toBeNull();
      if (edicao.evento === null) {
        throw new Error('O evento de edição deveria existir.');
      }

      const edicaoRealizada = await repositorio.editarComHistorico(
        edicao.veiculo,
        edicao.evento,
        atualizadoEmEsperado,
      );

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
        alteracoes: unknown;
        ocorridoEm: Date;
      }>(
        `
          SELECT
            tipo_evento AS "tipoEvento",
            alteracoes,
            ocorrido_em AS "ocorridoEm"
          FROM historico_veiculos
          WHERE id = $1
        `,
        [HISTORICO_EDICAO],
      );

      expect(edicaoRealizada).toBe(true);
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
          alteracoes: edicao.evento.alteracoes,
          ocorridoEm: DATA_ATUALIZACAO,
        },
      ]);
    });

    it('rejeita uma edição baseada em estado desatualizado', async () => {
      const gerarIdentificador = vi
        .fn()
        .mockReturnValueOnce(HISTORICO)
        .mockReturnValue(HISTORICO_EDICAO);
      const repositorio = new RepositorioVeiculosPostgres(pool, {
        gerar: gerarIdentificador,
      });
      const cadastro = criarCadastro(VEICULO_UM);
      await repositorio.cadastrarComHistorico(
        cadastro.veiculo,
        cadastro.evento,
      );
      const primeiraLeitura = await repositorio.buscarPorIdentificador(
        cadastro.veiculo.identificador,
      );
      const segundaLeitura = await repositorio.buscarPorIdentificador(
        cadastro.veiculo.identificador,
      );

      expect(primeiraLeitura).not.toBeNull();
      expect(segundaLeitura).not.toBeNull();
      if (primeiraLeitura === null || segundaLeitura === null) {
        throw new Error('O veículo deveria ter sido encontrado.');
      }

      const primeiraEdicao = primeiraLeitura.editar(
        { cor: 'Branco' },
        DATA_ATUALIZACAO,
      );
      const segundaEdicao = segundaLeitura.editar(
        { cor: 'Azul' },
        DATA_OUTRA_ATUALIZACAO,
      );

      expect(primeiraEdicao.evento).not.toBeNull();
      expect(segundaEdicao.evento).not.toBeNull();
      if (
        primeiraEdicao.evento === null ||
        segundaEdicao.evento === null
      ) {
        throw new Error('Os eventos de edição deveriam existir.');
      }

      const primeiraEdicaoRealizada =
        await repositorio.editarComHistorico(
          primeiraEdicao.veiculo,
          primeiraEdicao.evento,
          primeiraLeitura.atualizadoEm,
        );
      const segundaEdicaoRealizada =
        await repositorio.editarComHistorico(
          segundaEdicao.veiculo,
          segundaEdicao.evento,
          segundaLeitura.atualizadoEm,
        );
      const estadoPersistido = await pool.query<{
        cor: string;
        quantidadeHistorico: number;
      }>(
        `
          SELECT
            v.cor,
            COUNT(h.id)::integer AS "quantidadeHistorico"
          FROM veiculos v
          JOIN historico_veiculos h ON h.veiculo_id = v.id
          WHERE v.id = $1
          GROUP BY v.id
        `,
        [VEICULO_UM],
      );

      expect(primeiraEdicaoRealizada).toBe(true);
      expect(segundaEdicaoRealizada).toBe(false);
      expect(estadoPersistido.rows).toEqual([
        { cor: 'Branco', quantidadeHistorico: 2 },
      ]);
    });

    it('desfaz a edição quando a gravação do histórico falha', async () => {
      const repositorio = new RepositorioVeiculosPostgres(pool, {
        gerar: () => HISTORICO,
      });
      const cadastro = criarCadastro(VEICULO_UM);
      await repositorio.cadastrarComHistorico(
        cadastro.veiculo,
        cadastro.evento,
      );
      const veiculo = await repositorio.buscarPorIdentificador(
        cadastro.veiculo.identificador,
      );

      expect(veiculo).not.toBeNull();
      if (veiculo === null) {
        throw new Error('O veículo deveria ter sido encontrado.');
      }

      const edicao = veiculo.editar({ cor: 'Branco' }, DATA_ATUALIZACAO);
      expect(edicao.evento).not.toBeNull();
      if (edicao.evento === null) {
        throw new Error('O evento de edição deveria existir.');
      }

      await expect(
        repositorio.editarComHistorico(
          edicao.veiculo,
          edicao.evento,
          veiculo.atualizadoEm,
        ),
      ).rejects.toThrow();

      const resultado = await pool.query<{
        cor: string;
        atualizadoEm: Date;
      }>(
        `
          SELECT cor, atualizado_em AS "atualizadoEm"
          FROM veiculos
          WHERE id = $1
        `,
        [VEICULO_UM],
      );

      expect(resultado.rows).toEqual([
        { cor: 'Preto', atualizadoEm: DATA_CADASTRO },
      ]);
    });
  },
);
