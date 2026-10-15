import type { AnoFabricacao } from './ano-fabricacao';
import { ErroDominio } from './erro-dominio';
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

export interface DadosReconstrucaoVeiculo {
  identificador: IdentificadorVeiculo;
  marca: string;
  modelo: string;
  anoFabricacao: AnoFabricacao;
  cor: string;
  precoAnunciado: Preco;
  situacao: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DadosEdicaoVeiculo {
  marca?: string | undefined;
  modelo?: string | undefined;
  anoFabricacao?: AnoFabricacao | undefined;
  cor?: string | undefined;
  precoAnunciado?: Preco | undefined;
}

function normalizarEValidarTextoObrigatorio(
  campo: string,
  codigoErro: string,
  valor: string,
): string {
  const valorNormalizado = valor.trim();

  if (valorNormalizado === '') {
    throw new ErroDominio(
      codigoErro,
      `O campo ${campo.toLowerCase()} é obrigatório.`,
    );
  }

  return valorNormalizado;
}

function copiarDataValida(
  data: Date,
  codigoErro: string,
  mensagemErro: string,
): Date {
  if (Number.isNaN(data.getTime())) {
    throw new ErroDominio(codigoErro, mensagemErro);
  }

  return new Date(data.getTime());
}

function validarSituacao(situacao: string): SituacaoVeiculo {
  if (
    situacao !== SituacaoVeiculo.DISPONIVEL &&
    situacao !== SituacaoVeiculo.VENDIDO
  ) {
    throw new ErroDominio(
      'SITUACAO_VEICULO_INVALIDA',
      'A situação do veículo é inválida.',
    );
  }

  return situacao;
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
    criadoEm: Date,
    atualizadoEm: Date,
  ) {
    this.criadoEmInterno = new Date(criadoEm.getTime());
    this.atualizadoEmInterno = new Date(atualizadoEm.getTime());
  }

  public static cadastrar(dados: DadosCadastroVeiculo): Veiculo {
    const marca = normalizarEValidarTextoObrigatorio(
      'marca',
      'MARCA_OBRIGATORIA',
      dados.marca,
    );
    const modelo = normalizarEValidarTextoObrigatorio(
      'modelo',
      'MODELO_OBRIGATORIO',
      dados.modelo,
    );
    const cor = normalizarEValidarTextoObrigatorio(
      'cor',
      'COR_OBRIGATORIA',
      dados.cor,
    );
    const cadastradoEm = copiarDataValida(
      dados.cadastradoEm,
      'DATA_CADASTRO_INVALIDA',
      'A data de cadastro deve ser válida.',
    );

    return new Veiculo(
      dados.identificador,
      marca,
      modelo,
      dados.anoFabricacao,
      cor,
      dados.precoAnunciado,
      SituacaoVeiculo.DISPONIVEL,
      cadastradoEm,
      cadastradoEm,
    );
  }

  public static reconstruir(dados: DadosReconstrucaoVeiculo): Veiculo {
    const marca = normalizarEValidarTextoObrigatorio(
      'marca',
      'MARCA_OBRIGATORIA',
      dados.marca,
    );
    const modelo = normalizarEValidarTextoObrigatorio(
      'modelo',
      'MODELO_OBRIGATORIO',
      dados.modelo,
    );
    const cor = normalizarEValidarTextoObrigatorio(
      'cor',
      'COR_OBRIGATORIA',
      dados.cor,
    );
    const situacao = validarSituacao(dados.situacao);
    const criadoEm = copiarDataValida(
      dados.criadoEm,
      'DATA_CADASTRO_INVALIDA',
      'A data de cadastro deve ser válida.',
    );
    const atualizadoEm = copiarDataValida(
      dados.atualizadoEm,
      'DATA_ATUALIZACAO_INVALIDA',
      'A data de atualização deve ser válida.',
    );

    return new Veiculo(
      dados.identificador,
      marca,
      modelo,
      dados.anoFabricacao,
      cor,
      dados.precoAnunciado,
      situacao,
      criadoEm,
      atualizadoEm,
    );
  }

  public editar(dados: DadosEdicaoVeiculo, atualizadoEm: Date): Veiculo {
    const marca = normalizarEValidarTextoObrigatorio(
      'marca',
      'MARCA_OBRIGATORIA',
      dados.marca ?? this.marca,
    );
    const modelo = normalizarEValidarTextoObrigatorio(
      'modelo',
      'MODELO_OBRIGATORIO',
      dados.modelo ?? this.modelo,
    );
    const anoFabricacao = dados.anoFabricacao ?? this.anoFabricacao;
    const cor = normalizarEValidarTextoObrigatorio(
      'cor',
      'COR_OBRIGATORIA',
      dados.cor ?? this.cor,
    );
    const precoAnunciado = dados.precoAnunciado ?? this.precoAnunciado;
    const dataAtualizacao = copiarDataValida(
      atualizadoEm,
      'DATA_ATUALIZACAO_INVALIDA',
      'A data de atualização deve ser válida.',
    );
    return new Veiculo(
      this.identificador,
      marca,
      modelo,
      anoFabricacao,
      cor,
      precoAnunciado,
      this.situacao,
      this.criadoEmInterno,
      dataAtualizacao,
    );
  }

  public get criadoEm(): Date {
    return new Date(this.criadoEmInterno.getTime());
  }

  public get atualizadoEm(): Date {
    return new Date(this.atualizadoEmInterno.getTime());
  }
}
