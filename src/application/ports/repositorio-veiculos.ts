import type { Veiculo } from '../../domain/veiculo';
import type { IdentificadorVeiculo } from '../../domain/identificador-veiculo';

export interface RepositorioVeiculos {
  cadastrar(veiculo: Veiculo): Promise<void>;
  buscarPorIdentificador(
    identificador: IdentificadorVeiculo,
  ): Promise<Veiculo | null>;
  editar(veiculo: Veiculo): Promise<void>;
}
