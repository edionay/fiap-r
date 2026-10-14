export interface VerificadorSaudeBancoDados {
  estaPronto(): Promise<boolean>;
}
