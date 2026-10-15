import type { Pool } from 'pg';
import type { GeradorIdentificadores } from '../../../application/ports/gerador-identificadores';
import type {
  RepositorioEdicaoVeiculos,
  RepositorioVeiculos,
} from '../../../application/ports/repositorio-veiculos';
import { AnoFabricacao } from '../../../domain/ano-fabricacao';
import type { IdentificadorVeiculo } from '../../../domain/identificador-veiculo';
import { Preco } from '../../../domain/preco';
import { Veiculo } from '../../../domain/veiculo';
import type { VeiculoCadastrado } from '../../../domain/veiculo-cadastrado';
import type { VeiculoEditado } from '../../../domain/veiculo-editado';

interface RegistroVeiculo {
  id: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  cor: string;
  precoAnunciado: string;
  situacao: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

function formatarCentavosComoDecimal(centavos: number): string {
  const parteInteira = Math.trunc(centavos / 100);
  const parteDecimal = centavos % 100;

  return `${String(parteInteira)}.${String(parteDecimal).padStart(2, '0')}`;
}

function converterDecimalParaCentavos(valor: string): number {
  const [parteInteira = '0', parteDecimal = ''] = valor.split('.');

  return Number(parteInteira) * 100 + Number(parteDecimal.padEnd(2, '0'));
}

export class RepositorioVeiculosPostgres
  implements RepositorioVeiculos, RepositorioEdicaoVeiculos
{
  public constructor(
    private readonly pool: Pool,
    private readonly geradorIdentificadores: GeradorIdentificadores,
  ) {}

  public async cadastrarComHistorico(
    veiculo: Veiculo,
    evento: VeiculoCadastrado,
  ): Promise<void> {
    const conexao = await this.pool.connect();

    try {
      await conexao.query('BEGIN');
      await conexao.query(
        `
          INSERT INTO veiculos (
            id,
            marca,
            modelo,
            ano_fabricacao,
            cor,
            preco_anunciado,
            situacao,
            criado_em,
            atualizado_em
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          veiculo.identificador.valor,
          veiculo.marca,
          veiculo.modelo,
          veiculo.anoFabricacao.valor,
          veiculo.cor,
          formatarCentavosComoDecimal(veiculo.precoAnunciado.centavos),
          veiculo.situacao,
          veiculo.criadoEm,
          veiculo.atualizadoEm,
        ],
      );
      await conexao.query(
        `
          INSERT INTO historico_veiculos (
            id,
            veiculo_id,
            tipo_evento,
            alteracoes,
            ocorrido_em
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          this.geradorIdentificadores.gerar(),
          evento.veiculoId,
          evento.tipo,
          JSON.stringify(evento.dados),
          evento.ocorridoEm,
        ],
      );
      await conexao.query('COMMIT');
    } catch (erro: unknown) {
      await conexao.query('ROLLBACK');
      throw erro;
    } finally {
      conexao.release();
    }
  }

  public async buscarPorIdentificador(
    identificador: IdentificadorVeiculo,
  ): Promise<Veiculo | null> {
    const resultado = await this.pool.query<RegistroVeiculo>(
      `
        SELECT
          id,
          marca,
          modelo,
          ano_fabricacao AS "anoFabricacao",
          cor,
          preco_anunciado AS "precoAnunciado",
          situacao,
          criado_em AS "criadoEm",
          atualizado_em AS "atualizadoEm"
        FROM veiculos
        WHERE id = $1
      `,
      [identificador.valor],
    );
    const registro = resultado.rows[0];

    if (registro === undefined) {
      return null;
    }

    return Veiculo.reconstruir({
      identificador,
      marca: registro.marca,
      modelo: registro.modelo,
      anoFabricacao: AnoFabricacao.criar(
        registro.anoFabricacao,
        registro.atualizadoEm.getUTCFullYear(),
      ),
      cor: registro.cor,
      precoAnunciado: Preco.criarEmCentavos(
        converterDecimalParaCentavos(registro.precoAnunciado),
      ),
      situacao: registro.situacao,
      criadoEm: registro.criadoEm,
      atualizadoEm: registro.atualizadoEm,
    });
  }

  public async editarComHistorico(
    veiculo: Veiculo,
    evento: VeiculoEditado,
    atualizadoEmEsperado: Date,
  ): Promise<boolean> {
    const conexao = await this.pool.connect();

    try {
      await conexao.query('BEGIN');
      const resultado = await conexao.query(
        `
          UPDATE veiculos
          SET
            marca = $1,
            modelo = $2,
            ano_fabricacao = $3,
            cor = $4,
            preco_anunciado = $5,
            atualizado_em = $6
          WHERE
            id = $7
            AND situacao = 'DISPONIVEL'
            AND atualizado_em = $8
        `,
        [
          veiculo.marca,
          veiculo.modelo,
          veiculo.anoFabricacao.valor,
          veiculo.cor,
          formatarCentavosComoDecimal(veiculo.precoAnunciado.centavos),
          veiculo.atualizadoEm,
          veiculo.identificador.valor,
          atualizadoEmEsperado,
        ],
      );

      if (resultado.rowCount !== 1) {
        await conexao.query('ROLLBACK');
        return false;
      }

      await conexao.query(
        `
          INSERT INTO historico_veiculos (
            id,
            veiculo_id,
            tipo_evento,
            alteracoes,
            ocorrido_em
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          this.geradorIdentificadores.gerar(),
          evento.veiculoId,
          evento.tipo,
          JSON.stringify(evento.alteracoes),
          evento.ocorridoEm,
        ],
      );
      await conexao.query('COMMIT');
      return true;
    } catch (erro: unknown) {
      await conexao.query('ROLLBACK');
      throw erro;
    } finally {
      conexao.release();
    }
  }
}
