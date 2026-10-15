import type { Veiculo } from '../../domain/veiculo';
import type { Venda } from '../../domain/venda';

export interface RepositorioVendas {
  registrar(venda: Venda, veiculoVendido: Veiculo): Promise<void>;
}
