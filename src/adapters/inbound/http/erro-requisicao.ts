export class ErroRequisicao extends Error {
  public constructor(
    public readonly codigo: string,
    mensagem: string,
    public readonly detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = 'ErroRequisicao';
  }
}
