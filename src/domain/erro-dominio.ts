export class ErroDominio extends Error {
  public constructor(
    public readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroDominio';
  }
}
