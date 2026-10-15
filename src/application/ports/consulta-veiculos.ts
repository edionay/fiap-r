import type { SituacaoVeiculo } from '../../domain/situacao-veiculo';
import type { Veiculo } from '../../domain/veiculo';

export interface ConsultaVeiculos {
  listarPorSituacao(situacao: SituacaoVeiculo): Promise<Veiculo[]>;
}
