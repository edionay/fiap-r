import { AnoFabricacao } from '../../domain/ano-fabricacao';
import { IdentificadorVeiculo } from '../../domain/identificador-veiculo';
import { Preco } from '../../domain/preco';
import type { SituacaoVeiculo } from '../../domain/situacao-veiculo';
import { Veiculo } from '../../domain/veiculo';
import type { GeradorIdentificadores } from '../ports/gerador-identificadores';
import type { Relogio } from '../ports/relogio';
import type { RepositorioVeiculos } from '../ports/repositorio-veiculos';

export interface DadosCadastroVeiculo {
  marca: string;
  modelo: string;
  anoFabricacao: number;
  cor: string;
  precoAnunciadoCentavos: number;
}

export interface ResultadoCadastrarVeiculo {
  identificador: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  cor: string;
  precoAnunciadoCentavos: number;
  situacao: SituacaoVeiculo;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class CadastrarVeiculo {
  public constructor(
    private readonly repositorioVeiculos: RepositorioVeiculos,
    private readonly geradorIdentificadores: GeradorIdentificadores,
    private readonly relogio: Relogio,
  ) {}

  public async executar(
    dados: DadosCadastroVeiculo,
  ): Promise<ResultadoCadastrarVeiculo> {
    const cadastradoEm = this.relogio.agora();
    const anoFabricacao = AnoFabricacao.criar(
      dados.anoFabricacao,
      cadastradoEm.getUTCFullYear(),
    );
    const precoAnunciado = Preco.criarEmCentavos(
      dados.precoAnunciadoCentavos,
    );
    const identificador = IdentificadorVeiculo.criar(
      this.geradorIdentificadores.gerar(),
    );
    const { veiculo, evento } = Veiculo.cadastrar({
      identificador,
      marca: dados.marca,
      modelo: dados.modelo,
      anoFabricacao,
      cor: dados.cor,
      precoAnunciado,
      cadastradoEm,
    });

    await this.repositorioVeiculos.cadastrarComHistorico(veiculo, evento);

    return {
      identificador: veiculo.identificador.valor,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      anoFabricacao: veiculo.anoFabricacao.valor,
      cor: veiculo.cor,
      precoAnunciadoCentavos: veiculo.precoAnunciado.centavos,
      situacao: veiculo.situacao,
      criadoEm: veiculo.criadoEm,
      atualizadoEm: veiculo.atualizadoEm,
    };
  }
}
