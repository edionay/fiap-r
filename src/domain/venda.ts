import type { Cpf } from './cpf';
import { ErroDominio } from './erro-dominio';
import type { IdentificadorVeiculo } from './identificador-veiculo';

export interface DadosRegistroVenda {
  identificador: string;
  veiculoId: IdentificadorVeiculo;
  cpfComprador: Cpf;
  vendidoEm: Date;
}

function copiarDataVenda(data: Date): Date {
  if (Number.isNaN(data.getTime())) {
    throw new ErroDominio(
      'DATA_VENDA_INVALIDA',
      'A data da venda deve ser válida.',
    );
  }

  return new Date(data.getTime());
}

export class Venda {
  private readonly vendidoEmInterno: Date;

  private constructor(
    public readonly identificador: string,
    public readonly veiculoId: IdentificadorVeiculo,
    public readonly cpfComprador: Cpf,
    vendidoEm: Date,
  ) {
    this.vendidoEmInterno = new Date(vendidoEm.getTime());
  }

  public static registrar(dados: DadosRegistroVenda): Venda {
    const vendidoEm = copiarDataVenda(dados.vendidoEm);
    return new Venda(
      dados.identificador,
      dados.veiculoId,
      dados.cpfComprador,
      vendidoEm,
    );
  }

  public get vendidoEm(): Date {
    return new Date(this.vendidoEmInterno.getTime());
  }
}
