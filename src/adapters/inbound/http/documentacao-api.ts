import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export type EspecificacaoOpenApi = Record<string, unknown>;

export function registrarDocumentacaoApi(
  aplicacao: Express,
  especificacao: EspecificacaoOpenApi,
): void {
  aplicacao.get('/openapi.json', (_requisicao, resposta) => {
    resposta.json(especificacao);
  });
  aplicacao.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(especificacao, {
      customSiteTitle: 'Documentação da API de Gestão de Veículos',
    }),
  );
}
