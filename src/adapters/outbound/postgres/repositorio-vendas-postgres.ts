import type { Pool } from 'pg';
import type { RepositorioVendas } from '../../../application/ports/repositorio-vendas';
import { ErroDominio } from '../../../domain/erro-dominio';
import type { Veiculo } from '../../../domain/veiculo';
import type { Venda } from '../../../domain/venda';

export class RepositorioVendasPostgres implements RepositorioVendas {
  public constructor(private readonly pool: Pool) {}

  public async registrar(venda: Venda, veiculoVendido: Veiculo): Promise<void> {
    const conexao = await this.pool.connect();

    try {
      await conexao.query('BEGIN');
      const atualizacao = await conexao.query(
        `
          UPDATE veiculos
          SET situacao = 'VENDIDO', atualizado_em = $1
          WHERE id = $2 AND situacao = 'DISPONIVEL'
        `,
        [veiculoVendido.atualizadoEm, veiculoVendido.identificador.valor],
      );

      if (atualizacao.rowCount !== 1) {
        throw new ErroDominio(
          'VEICULO_JA_VENDIDO',
          'O veículo informado já foi vendido.',
        );
      }

      await conexao.query(
        `
          INSERT INTO vendas (
            id,
            veiculo_id,
            cpf_comprador,
            vendido_em
          )
          VALUES ($1, $2, $3, $4)
        `,
        [
          venda.identificador,
          venda.veiculoId.valor,
          venda.cpfComprador.valor,
          venda.vendidoEm,
        ],
      );
      await conexao.query(
        `
          INSERT INTO historico_veiculos (
            veiculo_id,
            tipo_evento,
            ocorrido_em
          )
          VALUES ($1, 'VEICULO_VENDIDO', $2)
        `,
        [venda.veiculoId.valor, venda.vendidoEm],
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
