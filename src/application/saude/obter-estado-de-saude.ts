export interface EstadoDeSaude {
  status: 'ok';
}

export function obterEstadoDeSaude(): EstadoDeSaude {
  return { status: 'ok' };
}
