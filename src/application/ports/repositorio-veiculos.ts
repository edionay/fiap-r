import type { Veiculo } from '../../domain/veiculo';
import type { VeiculoCadastrado } from '../../domain/veiculo-cadastrado';

export interface RepositorioVeiculos {
  cadastrarComHistorico(
    veiculo: Veiculo,
    evento: VeiculoCadastrado,
  ): Promise<void>;
}
