# Plataforma de Gestão de Veículos

API para administrar o catálogo e as vendas de uma revenda de veículos. A aplicação permite cadastrar e editar veículos, registrar vendas, consultar veículos disponíveis e vendidos e registrar as datas de cadastro, edição e venda.

## Funcionalidades

- Cadastro de veículos com marca, modelo, ano, cor e preço.
- Edição dos dados de veículos cadastrados.
- Registro de venda com CPF do comprador e data da venda.
- Consulta de veículos disponíveis por preço crescente.
- Consulta de veículos vendidos por preço crescente.
- Registro das datas de cadastro, edição e venda.

## Tecnologias

- Node.js 24 e TypeScript.
- TSOA e Express.
- PostgreSQL.
- Vitest.
- Docker e Docker Compose.

## Arquitetura

A aplicação utiliza Arquitetura Hexagonal. O domínio concentra as regras de negócio, os casos de uso coordenam os fluxos e as portas definem os contratos necessários. A API HTTP é o adaptador de entrada. PostgreSQL, relógio e geração de identificadores são adaptadores de saída.

```mermaid
flowchart LR
    CLIENTE[Cliente HTTP]
    HTTP[API TSOA e Express]
    APLICACAO[Casos de uso]
    DOMINIO[Domínio]
    PORTAS[Portas de saída]
    POSTGRES[(PostgreSQL)]
    SERVICOS[Relógio e UUID]
    CONFIG[Configuração]

    CLIENTE --> HTTP
    HTTP --> APLICACAO
    APLICACAO --> DOMINIO
    APLICACAO --> PORTAS
    POSTGRES -. implementa .-> PORTAS
    SERVICOS -. implementam .-> PORTAS
    CONFIG -. compõe .-> HTTP
    CONFIG -. compõe .-> APLICACAO
    CONFIG -. compõe .-> POSTGRES
    CONFIG -. compõe .-> SERVICOS
```

O código está organizado em:

- `src/domain`: regras e conceitos do negócio.
- `src/application`: casos de uso e portas.
- `src/adapters/inbound`: entrada HTTP e controllers.
- `src/adapters/outbound`: persistência e serviços de infraestrutura.
- `src/config`: configuração e composição das dependências.

## Execução com Docker

### Requisito

- Docker com Docker Compose.

Na raiz do projeto, execute:

```bash
docker compose up
```

Esse comando cria o PostgreSQL, executa as migrações e inicia a API. Quando os serviços estiverem prontos, a aplicação estará disponível em `http://localhost:3000`.

Verifique o funcionamento em:

```text
GET http://localhost:3000/health
GET http://localhost:3000/ready
```

A documentação interativa dos endpoints fica disponível em [http://localhost:3000/docs](http://localhost:3000/docs). O contrato OpenAPI em JSON pode ser consultado em [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json).

Para encerrar os serviços:

```bash
docker compose down
```

Os dados do PostgreSQL permanecem no volume `dados_postgres` após o encerramento.

## Endpoints

- `POST /veiculos`: cadastra um veículo.
- `PATCH /veiculos/{veiculoId}`: edita os dados de um veículo.
- `POST /veiculos/{veiculoId}/vendas`: registra a venda de um veículo.
- `GET /veiculos?situacao=DISPONIVEL`: lista os veículos disponíveis.
- `GET /veiculos?situacao=VENDIDO`: lista os veículos vendidos.
- `GET /health`: verifica o processo da API.
- `GET /ready`: verifica a API e a conexão com o PostgreSQL.
- `GET /docs`: abre a documentação interativa da API.
- `GET /openapi.json`: retorna o contrato OpenAPI.

Valores monetários são recebidos e devolvidos como strings decimais, por exemplo `"75000.99"`. Datas usam o formato ISO 8601 e o CPF é informado somente com os 11 dígitos.

## Testes e verificações

Para executar as verificações locais, use Node.js 24 e instale as dependências:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Com os serviços do Docker em execução, os testes de integração com PostgreSQL podem ser executados com:

```bash
TEST_DATABASE_URL=postgresql://veiculos:veiculos@localhost:5432/gestao_veiculos npm run test:integration:database
```

## Documentação de domínio

- [Linguagem ubíqua](docs/ddd/linguagem-ubiqua.md)
- [Domain Storytelling](docs/ddd/domain-storytelling.md)
- [Event Storming](docs/ddd/event-storming.md)
