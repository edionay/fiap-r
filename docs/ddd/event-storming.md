# Event Storming da gestão de veículos

## Objetivo

Este documento relaciona as intenções do Operador aos fatos relevantes da Gestão de Veículos. As definições dos termos estão na [linguagem ubíqua](linguagem-ubiqua.md), e a sequência das atividades está no [Domain Storytelling](domain-storytelling.md).

## Notação

- **Ator**: quem inicia uma ação.
- **Intenção ou comando de negócio**: o que o ator deseja realizar.
- **Agregado Veículo**: conceito central que recebe as alterações.
- **Fato ou evento de domínio**: resultado de uma ação concluída.

Intenções e fatos são elementos da modelagem. Eles não representam classes obrigatórias, CQRS, Event Sourcing ou comunicação assíncrona no código.

## Visão geral

```mermaid
flowchart LR
    O[Operador]
    C[Cadastrar veículo]
    E[Editar veículo]
    V[Registrar venda]
    A[(Veículo)]
    FC{{Veículo cadastrado}}
    FE{{Veículo editado}}
    FV{{Veículo vendido}}

    O --> C --> A --> FC
    O --> E --> A --> FE
    O --> V --> A --> FV
```

## Cadastro do veículo

```mermaid
flowchart LR
    O[Operador]
    I[Cadastrar veículo]
    A[(Veículo)]
    F{{Veículo cadastrado}}
    D[(Data de cadastro)]

    O -->|informa marca, modelo, ano, cor e preço| I
    I -->|valida e cadastra como disponível| A
    A --> F
    F -->|registra| D
```

O fato **Veículo cadastrado** indica que o Veículo entrou no catálogo com situação `DISPONIVEL` e que a data do cadastro foi registrada.

## Edição do veículo

```mermaid
flowchart LR
    O[Operador]
    I[Editar veículo]
    A[(Veículo)]
    F{{Veículo editado}}
    D[(Data de edição)]

    O -->|informa identificador e novos dados| I
    I -->|busca, valida e atualiza| A
    A --> F
    F -->|registra| D
```

O fato **Veículo editado** indica que os dados do Veículo foram atualizados e que a data da edição foi registrada.

## Venda do veículo

```mermaid
flowchart LR
    O[Operador]
    I[Registrar venda]
    A[(Veículo)]
    F{{Veículo vendido}}
    VD[(Venda)]
    D[(Data da venda)]

    O -->|informa veículo, CPF e data| I
    I -->|valida e confirma disponibilidade| A
    A --> F
    F -->|registra| VD
    F -->|registra| D
```

O fato **Veículo vendido** indica que a Venda foi registrada, a situação do Veículo passou para `VENDIDO` e a data da venda foi registrada.

## Consultas do catálogo

```mermaid
flowchart LR
    O[Operador]
    D[Listar disponíveis]
    V[Listar vendidos]
    C[(Catálogo)]
    LD([Disponíveis por preço crescente])
    LV([Vendidos por preço crescente])

    O --> D --> C --> LD
    O --> V --> C --> LV
```

As consultas não alteram o Veículo e não produzem novos fatos. Elas filtram o catálogo pela situação solicitada e ordenam o resultado pelo preço do menor para o maior.

## Sequência dos fatos

```mermaid
flowchart LR
    C{{Veículo cadastrado}}
    E{{Veículo editado}}
    V{{Veículo vendido}}

    C -->|pode ser editado| E
    E -->|pode ter novas edições| E
    C -->|pode ser vendido| V
    E -->|pode ser vendido| V
```

Cada cadastro, edição e venda registra a data correspondente. Os fatos descrevem o resultado observado no domínio, enquanto a implementação realiza os fluxos de forma direta e síncrona.
