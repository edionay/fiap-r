import { TipoEventoVeiculo } from './tipo-evento-veiculo';

export interface Alteracao<T> {
  readonly anterior: T;
  readonly atual: T;
}

export interface AlteracoesVeiculo {
  readonly marca?: Alteracao<string>;
  readonly modelo?: Alteracao<string>;
  readonly anoFabricacao?: Alteracao<number>;
  readonly cor?: Alteracao<string>;
  readonly precoAnunciadoCentavos?: Alteracao<number>;
}

export interface VeiculoEditado {
  readonly tipo: typeof TipoEventoVeiculo.EDITADO;
  readonly veiculoId: string;
  readonly alteracoes: AlteracoesVeiculo;
  readonly ocorridoEm: string;
}

function congelarAlteracao<T>(alteracao: Alteracao<T>): Alteracao<T> {
  return Object.freeze({ ...alteracao });
}

export function criarEventoVeiculoEditado(
  veiculoId: string,
  alteracoes: AlteracoesVeiculo,
  ocorridoEm: Date,
): VeiculoEditado {
  const alteracoesCongeladas: AlteracoesVeiculo = Object.freeze({
    ...(alteracoes.marca === undefined
      ? {}
      : { marca: congelarAlteracao(alteracoes.marca) }),
    ...(alteracoes.modelo === undefined
      ? {}
      : { modelo: congelarAlteracao(alteracoes.modelo) }),
    ...(alteracoes.anoFabricacao === undefined
      ? {}
      : {
          anoFabricacao: congelarAlteracao(alteracoes.anoFabricacao),
        }),
    ...(alteracoes.cor === undefined
      ? {}
      : { cor: congelarAlteracao(alteracoes.cor) }),
    ...(alteracoes.precoAnunciadoCentavos === undefined
      ? {}
      : {
          precoAnunciadoCentavos: congelarAlteracao(
            alteracoes.precoAnunciadoCentavos,
          ),
        }),
  });

  return Object.freeze({
    tipo: TipoEventoVeiculo.EDITADO,
    veiculoId,
    alteracoes: alteracoesCongeladas,
    ocorridoEm: ocorridoEm.toISOString(),
  });
}
