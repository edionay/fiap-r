export const TipoEventoVeiculo = {
  CADASTRADO: 'VEICULO_CADASTRADO',
  EDITADO: 'VEICULO_EDITADO',
} as const;

export type TipoEventoVeiculo =
  (typeof TipoEventoVeiculo)[keyof typeof TipoEventoVeiculo];
