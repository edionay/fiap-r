import type { Veiculo } from '../../domain/veiculo';
import type { VeiculoCadastrado } from '../../domain/veiculo-cadastrado';
import type { VeiculoEditado } from '../../domain/veiculo-editado';
import type { IdentificadorVeiculo } from '../../domain/identificador-veiculo';

export interface RepositorioVeiculos {
  cadastrarComHistorico(
    veiculo: Veiculo,
    evento: VeiculoCadastrado,
  ): Promise<void>;
}

export interface RepositorioEdicaoVeiculos {
  buscarPorIdentificador(
    identificador: IdentificadorVeiculo,
  ): Promise<Veiculo | null>;
  editarComHistorico(
    veiculo: Veiculo,
    evento: VeiculoEditado,
  ): Promise<void>;
}
