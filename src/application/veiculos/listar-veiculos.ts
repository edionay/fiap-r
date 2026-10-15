import type { SituacaoVeiculo } from '../../domain/situacao-veiculo';
import type { Veiculo } from '../../domain/veiculo';
import type { ConsultaVeiculos } from '../ports/consulta-veiculos';

export interface VeiculoListado {
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

function criarResultado(veiculo: Veiculo): VeiculoListado {
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

export class ListarVeiculos {
  public constructor(private readonly consultaVeiculos: ConsultaVeiculos) {}

  public async executar(
    situacao: SituacaoVeiculo,
  ): Promise<VeiculoListado[]> {
    const veiculos = await this.consultaVeiculos.listarPorSituacao(situacao);

    return veiculos.map(criarResultado);
  }
}
