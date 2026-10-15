import type { AnoFabricacao } from './ano-fabricacao';
import { ErroDominio } from './erro-dominio';
import {
  criarEventoVeiculoCadastrado,
  type VeiculoCadastrado,
} from './veiculo-cadastrado';
import type { IdentificadorVeiculo } from './identificador-veiculo';
import type { Preco } from './preco';
import { SituacaoVeiculo } from './situacao-veiculo';
import {
  type Alteracao,
  type AlteracoesVeiculo,
  criarEventoVeiculoEditado,
  type VeiculoEditado,
} from './veiculo-editado';

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

export interface ResultadoEdicaoVeiculo {
  veiculo: Veiculo;
  evento: VeiculoEditado | null;
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

function criarAlteracao<T>(anterior: T, atual: T): Alteracao<T> {
  return { anterior, atual };
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

  public static cadastrar(
    dados: DadosCadastroVeiculo,
  ): ResultadoCadastroVeiculo {
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

    const veiculo = new Veiculo(
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

  public editar(
    dados: DadosEdicaoVeiculo,
    atualizadoEm: Date,
  ): ResultadoEdicaoVeiculo {
    if (this.situacao !== SituacaoVeiculo.DISPONIVEL) {
      throw new ErroDominio(
        'VEICULO_NAO_DISPONIVEL',
        'Somente veículos disponíveis podem ser editados.',
      );
    }

    const marca =
      dados.marca === undefined
        ? this.marca
        : normalizarEValidarTextoObrigatorio(
            'marca',
            'MARCA_OBRIGATORIA',
            dados.marca,
          );
    const modelo =
      dados.modelo === undefined
        ? this.modelo
        : normalizarEValidarTextoObrigatorio(
            'modelo',
            'MODELO_OBRIGATORIO',
            dados.modelo,
          );
    const anoFabricacao = dados.anoFabricacao ?? this.anoFabricacao;
    const cor =
      dados.cor === undefined
        ? this.cor
        : normalizarEValidarTextoObrigatorio(
            'cor',
            'COR_OBRIGATORIA',
            dados.cor,
          );
    const precoAnunciado = dados.precoAnunciado ?? this.precoAnunciado;
    const alteracoes: AlteracoesVeiculo = {
      ...(marca === this.marca
        ? {}
        : { marca: criarAlteracao(this.marca, marca) }),
      ...(modelo === this.modelo
        ? {}
        : { modelo: criarAlteracao(this.modelo, modelo) }),
      ...(anoFabricacao.igualA(this.anoFabricacao)
        ? {}
        : {
            anoFabricacao: criarAlteracao(
              this.anoFabricacao.valor,
              anoFabricacao.valor,
            ),
          }),
      ...(cor === this.cor
        ? {}
        : { cor: criarAlteracao(this.cor, cor) }),
      ...(precoAnunciado.igualA(this.precoAnunciado)
        ? {}
        : {
            precoAnunciadoCentavos: criarAlteracao(
              this.precoAnunciado.centavos,
              precoAnunciado.centavos,
            ),
          }),
    };

    if (Object.keys(alteracoes).length === 0) {
      return { veiculo: this, evento: null };
    }

    const dataAtualizacao = copiarDataValida(
      atualizadoEm,
      'DATA_ATUALIZACAO_INVALIDA',
      'A data de atualização deve ser válida.',
    );
    const veiculo = new Veiculo(
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
    const evento = criarEventoVeiculoEditado(
      this.identificador.valor,
      alteracoes,
      dataAtualizacao,
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
