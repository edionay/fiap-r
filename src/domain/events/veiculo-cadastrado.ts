import type { SituacaoVeiculo } from '../entities/situacao-veiculo';

export const TipoEventoVeiculo = {
  CADASTRADO: 'VEICULO_CADASTRADO',
} as const;

export interface DadosIniciaisVeiculo {
  readonly marca: string;
  readonly modelo: string;
  readonly anoFabricacao: number;
  readonly cor: string;
  readonly precoAnunciadoCentavos: number;
  readonly situacao: SituacaoVeiculo;
}

export interface VeiculoCadastrado {
  readonly tipo: typeof TipoEventoVeiculo.CADASTRADO;
  readonly veiculoId: string;
  readonly dados: DadosIniciaisVeiculo;
  readonly ocorridoEm: string;
}

export function criarEventoVeiculoCadastrado(
  veiculoId: string,
  dados: DadosIniciaisVeiculo,
  ocorridoEm: Date,
): VeiculoCadastrado {
  return Object.freeze({
    tipo: TipoEventoVeiculo.CADASTRADO,
    veiculoId,
    dados: Object.freeze({ ...dados }),
    ocorridoEm: ocorridoEm.toISOString(),
  });
}
