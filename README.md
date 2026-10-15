# Plataforma de Gestão de Veículos

API para gestão do catálogo e do processo de venda de uma revenda de veículos. A plataforma centraliza o cadastro, a atualização, a consulta e a venda dos veículos, mantendo um histórico auditável das mudanças realizadas ao longo do ciclo de vida de cada item.

## Capacidades do produto

- Cadastrar veículos disponíveis para venda.
- Atualizar marca, modelo, ano, cor e preço de um veículo.
- Registrar a venda com CPF do comprador e data da operação.
- Consultar veículos disponíveis, ordenados do menor para o maior preço.
- Consultar veículos vendidos, ordenados do menor para o maior preço.
- Consultar o histórico de cadastro, alterações e venda de cada veículo.

## Arquitetura

A aplicação será organizada segundo a Arquitetura Hexagonal. O domínio e os casos de uso não dependerão do framework HTTP nem do mecanismo de persistência. Controllers e PostgreSQL serão adaptadores conectados à aplicação por contratos explícitos.

Essa separação permite testar as regras de negócio sem banco de dados ou servidor HTTP e trocar detalhes de infraestrutura sem alterar o núcleo da solução.

## Tecnologias

- Node.js
- TypeScript
- TSOA
- Express
- PostgreSQL
- Docker e Docker Compose
- Vitest

## Estado atual

O projeto possui servidor HTTP, geração OpenAPI, rotas de saúde e prontidão, PostgreSQL, migrações, containers e testes automatizados. Os fluxos de cadastro e edição estão disponíveis em `POST /veiculos` e `PATCH /veiculos/{veiculoId}`. O adaptador PostgreSQL persiste cada mudança com seu histórico na mesma transação e protege a edição contra alterações concorrentes.

## Execução com Docker

Crie e inicie a API e o PostgreSQL com:

```bash
docker compose up --build
```

O Compose aguarda o PostgreSQL ficar saudável, executa as migrações pendentes e somente então inicia a API. Os dados do banco são preservados no volume `dados_postgres`.

Para encerrar os containers sem remover os dados:

```bash
docker compose down
```

## Requisitos

- Node.js 24 LTS.
- npm 11 ou superior.
- Docker com Docker Compose para o ambiente completo.

## Execução para desenvolvimento

Use a versão de Node.js definida no projeto, instale as dependências e inicie o servidor:

```bash
nvm use
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:migrate:dev
npm run dev
```

A API estará disponível em `http://localhost:3000`. A porta pode ser alterada pela variável de ambiente `PORT`.

Verifique a aplicação em:

```text
GET http://localhost:3000/health
GET http://localhost:3000/ready
```

`/health` verifica o processo da API. `/ready` verifica também a conexão com o PostgreSQL e responde com código `503` quando o banco não está disponível.

As respostas esperadas são:

```json
{
  "status": "ok"
}
```

```json
{
  "status": "ready"
}
```

## Cadastro de veículos

Cadastre um veículo com:

```bash
curl --request POST http://localhost:3000/veiculos \
  --header 'Content-Type: application/json' \
  --data '{
    "marca": "Honda",
    "modelo": "Civic",
    "anoFabricacao": 2025,
    "cor": "Preto",
    "precoAnunciado": "75000.99"
  }'
```

O preço é informado como string decimal, sem separador de milhares, para preservar a precisão monetária. Uma resposta bem-sucedida usa o código `201`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "marca": "Honda",
  "modelo": "Civic",
  "anoFabricacao": 2025,
  "cor": "Preto",
  "precoAnunciado": "75000.99",
  "situacao": "DISPONIVEL",
  "criadoEm": "2026-10-14T12:00:00.000Z",
  "atualizadoEm": "2026-10-14T12:00:00.000Z"
}
```

## Edição de veículos

Edite somente os campos necessários com:

```bash
curl --request PATCH http://localhost:3000/veiculos/550e8400-e29b-41d4-a716-446655440000 \
  --header 'Content-Type: application/json' \
  --data '{
    "cor": "Branco",
    "precoAnunciado": "80000.00"
  }'
```

É possível alterar `marca`, `modelo`, `anoFabricacao`, `cor` e `precoAnunciado`. Campos omitidos permanecem inalterados. Uma requisição sem mudanças efetivas retorna o estado atual sem modificar a data de atualização ou criar histórico.

Uma edição bem-sucedida retorna código `200`. Veículo inexistente retorna `404`, enquanto veículo vendido ou alterado por uma operação concorrente retorna `409`.

## Banco de dados

A configuração local está em `.env.example`. O arquivo `.env` não é versionado.

Variáveis disponíveis:

- `DATABASE_URL`: endereço completo do PostgreSQL.
- `DB_MAX_CONNECTIONS`: limite de conexões do pool.
- `DB_IDLE_TIMEOUT_MS`: tempo máximo de inatividade de uma conexão.
- `DB_CONNECTION_TIMEOUT_MS`: limite para estabelecer uma conexão.

Execute migrações no ambiente de desenvolvimento com:

```bash
npm run db:migrate:dev
```

Reverta a última migração com:

```bash
npm run db:migrate:down:dev
```

O esquema inicial contém as tabelas `veiculos`, `vendas` e `historico_veiculos`, além de índices e restrições de integridade.

## OpenAPI

Gere a especificação e as rotas do TSOA com:

```bash
npm run generate
```

A especificação será criada em `dist/openapi/swagger.json`. As rotas geradas são artefatos de build e não são versionadas.

## Testes e verificações

Os comandos previstos para validação são:

```bash
npm run typecheck
npm run lint
npm test
npm run build
docker compose config --quiet
```

Os testes atuais cobrem configuração, saúde, prontidão, adaptador PostgreSQL e contratos HTTP. Com o PostgreSQL local iniciado e migrado, execute a integração real com:

```bash
TEST_DATABASE_URL=postgresql://veiculos:veiculos@localhost:5432/gestao_veiculos npm run test:integration:database
```

O modelo de domínio possui testes unitários para a entidade Veículo e seus objetos de valor. As próximas funcionalidades devem incluir testes unitários para os casos de uso.

## Documentação

O README será atualizado a cada mudança relevante do produto. A documentação de domínio será construída de forma incremental e incluirá linguagem ubíqua, Event Storming e Domain Storytelling.

- [Linguagem ubíqua e regras do domínio](docs/ddd/linguagem-ubiqua.md)
- [Domain Storytelling da gestão de veículos](docs/ddd/domain-storytelling.md)
- [Event Storming da gestão de veículos](docs/ddd/event-storming.md)

## Plano de evolução

O desenvolvimento será dividido nas seguintes entregas:

1. Fundação documental e definição dos requisitos.
2. Modelagem DDD.
3. Estrutura executável da API e do ambiente local.
4. Cadastro de veículos.
5. Edição e histórico de alterações.
6. Venda de veículos.
7. Consultas de veículos disponíveis e vendidos.
8. Consolidação da documentação e preparação da entrega.
