import { Cpf } from '../../domain/cpf';
import { IdentificadorVeiculo } from '../../domain/identificador-veiculo';
import type { SituacaoVeiculo } from '../../domain/situacao-veiculo';
import { Venda } from '../../domain/venda';
import { ErroAplicacao } from '../erro-aplicacao';
import type { GeradorIdentificadores } from '../ports/gerador-identificadores';
import type { RepositorioVeiculos } from '../ports/repositorio-veiculos';
import type { RepositorioVendas } from '../ports/repositorio-vendas';

export interface DadosRegistroVenda {
  veiculoId: string;
  cpfComprador: string;
  vendidoEm: Date;
}

export interface ResultadoRegistrarVenda {
  identificador: string;
  veiculoId: string;
  situacao: SituacaoVeiculo;
  vendidoEm: Date;
}

export class RegistrarVenda {
  public constructor(
    private readonly repositorioVeiculos: RepositorioVeiculos,
    private readonly repositorioVendas: RepositorioVendas,
    private readonly geradorIdentificadores: GeradorIdentificadores,
  ) {}

  public async executar(
    dados: DadosRegistroVenda,
  ): Promise<ResultadoRegistrarVenda> {
    const veiculoId = IdentificadorVeiculo.criar(dados.veiculoId);
    const cpfComprador = Cpf.criar(dados.cpfComprador);
    const veiculo =
      await this.repositorioVeiculos.buscarPorIdentificador(veiculoId);

    if (veiculo === null) {
      throw new ErroAplicacao(
        'VEICULO_NAO_ENCONTRADO',
        'O veículo informado não foi encontrado.',
      );
    }

    const veiculoVendido = veiculo.vender(dados.vendidoEm);
    const venda = Venda.registrar({
      identificador: this.geradorIdentificadores.gerar(),
      veiculoId,
      cpfComprador,
      vendidoEm: dados.vendidoEm,
    });

    await this.repositorioVendas.registrar(venda, veiculoVendido);

    return {
      identificador: venda.identificador,
      veiculoId: venda.veiculoId.valor,
      situacao: veiculoVendido.situacao,
      vendidoEm: venda.vendidoEm,
    };
  }
}
