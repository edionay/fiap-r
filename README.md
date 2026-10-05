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
- PostgreSQL
- Docker e Docker Compose
- Testes unitários

## Estado atual

O projeto está na fase de especificação. Esta primeira entrega define requisitos, arquitetura, decisões iniciais e o plano incremental. O código executável e os arquivos de infraestrutura serão adicionados nas próximas entregas.

## Execução com Docker

O contrato de execução local será um único comando:

```bash
docker compose up --build
```

Quando a implementação estiver disponível, esse comando iniciará a API e o PostgreSQL com todas as dependências necessárias. A API terá uma rota de verificação de saúde e documentação OpenAPI gerada pelo TSOA.

## Execução para desenvolvimento

Os comandos previstos para o ambiente de desenvolvimento são:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

As versões suportadas do Node.js e os valores de configuração serão registrados junto com a estrutura inicial da aplicação.

## Testes e verificações

Os comandos previstos para validação são:

```bash
npm run typecheck
npm run lint
npm test
```

Os testes unitários cobrirão entidades, objetos de valor e casos de uso. Testes de integração da persistência e da API serão adicionados quando necessários para proteger os contratos entre adaptadores.

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
