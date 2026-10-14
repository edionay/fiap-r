import type { AnoFabricacao } from './ano-fabricacao';
import { ErroDominio } from './erro-dominio';
import {
  criarEventoVeiculoCadastrado,
  type VeiculoCadastrado,
} from './veiculo-cadastrado';
import type { IdentificadorVeiculo } from './identificador-veiculo';
import type { Preco } from './preco';
import { SituacaoVeiculo } from './situacao-veiculo';

export interface DadosCadastroVeiculo {
  identificador: IdentificadorVeiculo;
  marca: string;
  modelo: string;
  anoFabricacao: AnoFabricacao;
  cor: string;
  precoAnunciado: Preco;
  cadastradoEm: Date;
}

export interface ResultadoCadastroVeiculo {
  veiculo: Veiculo;
  evento: VeiculoCadastrado;
}

function normalizarEValidarTextoObrigatorio(
  campo: string,
  codigoErro: string,
  valor: string,
): string {
  const valorNormalizado = valor.trim();

  if (valorNormalizado === '') {
    throw new ErroDominio(codigoErro, `${campo} é obrigatório.`);
  }

  return valorNormalizado;
}

function validarData(data: Date): Date {
  if (Number.isNaN(data.getTime())) {
    throw new ErroDominio(
      'DATA_CADASTRO_INVALIDA',
      'A data de cadastro deve ser válida.',
    );
  }

  return new Date(data.getTime());
}

export class Veiculo {
  private readonly criadoEmInterno: Date;
  private readonly atualizadoEmInterno: Date;

  private constructor(
    public readonly identificador: IdentificadorVeiculo,
    public readonly marca: string,
    public readonly modelo: string,
    public readonly anoFabricacao: AnoFabricacao,
    public readonly cor: string,
    public readonly precoAnunciado: Preco,
    public readonly situacao: SituacaoVeiculo,
    cadastradoEm: Date,
  ) {
    this.criadoEmInterno = cadastradoEm;
    this.atualizadoEmInterno = new Date(cadastradoEm.getTime());
  }

  public static cadastrar(
    dados: DadosCadastroVeiculo,
  ): ResultadoCadastroVeiculo {
    const marca = normalizarEValidarTextoObrigatorio(
      'Marca',
      'MARCA_OBRIGATORIA',
      dados.marca,
    );
    const modelo = normalizarEValidarTextoObrigatorio(
      'Modelo',
      'MODELO_OBRIGATORIO',
      dados.modelo,
    );
    const cor = normalizarEValidarTextoObrigatorio(
      'Cor',
      'COR_OBRIGATORIA',
      dados.cor,
    );
    const cadastradoEm = validarData(dados.cadastradoEm);

    const veiculo = new Veiculo(
      dados.identificador,
      marca,
      modelo,
      dados.anoFabricacao,
      cor,
      dados.precoAnunciado,
      SituacaoVeiculo.DISPONIVEL,
      cadastradoEm,
    );

    const evento = criarEventoVeiculoCadastrado(
      veiculo.identificador.valor,
      {
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        anoFabricacao: veiculo.anoFabricacao.valor,
        cor: veiculo.cor,
        precoAnunciadoCentavos: veiculo.precoAnunciado.centavos,
        situacao: veiculo.situacao,
      },
      cadastradoEm,
    );

    return { veiculo, evento };
  }

  public get criadoEm(): Date {
    return new Date(this.criadoEmInterno.getTime());
  }

  public get atualizadoEm(): Date {
    return new Date(this.atualizadoEmInterno.getTime());
  }
}
