export const SituacaoVeiculo = {
  DISPONIVEL: 'DISPONIVEL',
  VENDIDO: 'VENDIDO',
} as const;

export type SituacaoVeiculo =
  (typeof SituacaoVeiculo)[keyof typeof SituacaoVeiculo];
