import type { Pool } from 'pg';
import type { GeradorIdentificadores } from '../../../application/ports/gerador-identificadores';
import type { RepositorioVeiculos } from '../../../application/ports/repositorio-veiculos';
import type { Veiculo } from '../../../domain/veiculo';
import type { VeiculoCadastrado } from '../../../domain/veiculo-cadastrado';

function formatarCentavosComoDecimal(centavos: number): string {
  const parteInteira = Math.trunc(centavos / 100);
  const parteDecimal = centavos % 100;

  return `${String(parteInteira)}.${String(parteDecimal).padStart(2, '0')}`;
}

export class RepositorioVeiculosPostgres implements RepositorioVeiculos {
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
}
