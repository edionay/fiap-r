# Linguagem ubíqua da gestão de veículos

## Objetivo

Este documento define o vocabulário compartilhado da Gestão de Veículos. Os termos devem manter o mesmo significado nos requisitos, no código, nos testes e no contrato da API.

## Contexto

A Gestão de Veículos administra o catálogo de uma revenda. O contexto permite cadastrar e editar veículos, registrar vendas, consultar veículos disponíveis e vendidos e registrar as datas dessas alterações.

## Atores

### Operador

Pessoa ou sistema que cadastra e edita veículos, registra vendas e consulta o catálogo.

### Comprador

Pessoa que adquire um veículo. É identificada pelo CPF informado no registro da venda e não possui cadastro próprio.

## Termos do domínio

### Veículo

Item individual do catálogo. Possui identificador, marca, modelo, ano de fabricação, cor, preço, situação, data de cadastro e data da última alteração.

### Preço

Valor anunciado do veículo. É usado para ordenar as listagens do menor para o maior valor.

### Situação do veículo

Indica se o veículo está `DISPONIVEL` ou `VENDIDO`.

### Veículo disponível

Veículo que ainda pode ser vendido.

### Veículo vendido

Veículo que possui uma venda registrada.

### Venda

Registro que relaciona um veículo ao CPF do comprador e à data da venda. Um veículo pode ser vendido uma única vez.

### Data de cadastro

Momento em que o veículo foi incluído no catálogo.

### Data de edição

Momento em que os dados do veículo foram editados.

### Data de venda

Momento informado para a venda do veículo.

### Histórico de alterações

Registro das datas de cadastro, edição e venda relacionadas ao veículo. O histórico preserva o tipo da alteração e o momento em que ela ocorreu.

## Operações

- **Cadastrar veículo**: incluir no catálogo um veículo com marca, modelo, ano, cor e preço.
- **Editar veículo**: alterar os dados de um veículo já cadastrado.
- **Registrar venda**: informar o veículo, o CPF do comprador e a data da venda, alterando a situação do veículo para `VENDIDO`.
- **Listar veículos disponíveis**: consultar veículos com situação `DISPONIVEL`, ordenados do menor para o maior preço.
- **Listar veículos vendidos**: consultar veículos com situação `VENDIDO`, ordenados do menor para o maior preço.
- **Registrar alteração**: guardar a data de cada cadastro, edição ou venda.

## Regras do domínio

- Todo veículo possui um identificador único.
- Marca, modelo e cor são obrigatórios.
- O ano de fabricação deve representar um ano válido.
- O preço deve ser maior que zero.
- Um veículo é cadastrado com a situação `DISPONIVEL`.
- A edição mantém os dados não informados e atualiza a data da alteração.
- O CPF do comprador deve ser válido.
- Somente um veículo disponível pode ser vendido.
- A venda altera a situação do veículo para `VENDIDO`.
- Cadastro, edição e venda registram suas respectivas datas.
- Veículos disponíveis e vendidos são listados por preço em ordem crescente.
- Datas são expostas no formato ISO 8601.

## Fatos do domínio

Os fatos abaixo representam resultados relevantes para a modelagem DDD. Eles não exigem eventos de domínio no código ou comunicação assíncrona.

- **Veículo cadastrado**: um veículo foi incluído no catálogo.
- **Veículo editado**: os dados de um veículo foram atualizados.
- **Veículo vendido**: uma venda foi registrada para o veículo.

## Correspondência com o código

- Veículo: `Veiculo`.
- Venda: `Venda`.
- Preço: `Preco`.
- CPF: `Cpf`.
- Situação do veículo: `SituacaoVeiculo`.
- Cadastrar veículo: `CadastrarVeiculo`.
- Editar veículo: `EditarVeiculo`.
- Registrar venda: `RegistrarVenda`.
- Listar veículos: `ListarVeiculos`.
