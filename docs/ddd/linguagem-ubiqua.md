# Linguagem ubíqua e regras do domínio

## Objetivo

Este documento define o vocabulário compartilhado entre negócio, desenvolvimento e documentação da Plataforma de Gestão de Veículos. Os termos aqui descritos devem ser usados com o mesmo significado em requisitos, código, testes, contratos da API e discussões sobre o produto.

## Contexto delimitado

O escopo atual pertence ao contexto delimitado **Gestão de Veículos**. Esse contexto controla o catálogo da revenda, a disponibilidade dos veículos, o registro das vendas e o histórico das mudanças.

Pagamento, financiamento, clientes, usuários, filiais e publicação em canais externos não pertencem a este contexto nesta versão.

## Atores

### Operador

Pessoa ou sistema autorizado a cadastrar veículos, editar seus dados, registrar vendas e consultar informações do catálogo.

### Comprador

Pessoa que adquire um veículo. No escopo atual, o comprador é identificado somente pelo CPF informado no registro da venda. O comprador não possui cadastro próprio.

## Termos do domínio

### Veículo

Item individual do catálogo da revenda. É identificado de forma única e reúne marca, modelo, ano de fabricação, cor, preço anunciado, situação e datas de controle.

Dois veículos com os mesmos dados comerciais continuam sendo itens diferentes e devem possuir identificadores distintos.

### Dados do veículo

Conjunto formado por marca, modelo, ano de fabricação, cor e preço anunciado. Esses dados podem ser editados enquanto o veículo estiver disponível.

### Marca

Fabricante comercial do veículo, como Honda, Ford ou Toyota.

### Modelo

Nome comercial que identifica a linha do veículo dentro de uma marca.

### Ano de fabricação

Ano em que o veículo foi fabricado. Não representa ano do modelo e não pode ser posterior ao próximo ano civil.

### Cor

Descrição comercial da cor predominante do veículo.

### Preço anunciado

Valor pelo qual um veículo disponível está sendo oferecido. Deve ser maior que zero e ter no máximo duas casas decimais.

O termo preço, quando usado sem qualificação durante o período de disponibilidade, significa preço anunciado.

### Situação do veículo

Estado atual do veículo dentro do catálogo. Nesta versão, existem somente as situações Disponível e Vendido.

### Veículo disponível

Veículo que pode ter seus dados editados e cuja venda pode ser registrada. Corresponde à situação técnica `AVAILABLE`.

### Veículo vendido

Veículo que possui uma venda registrada e não está mais disponível. Seus dados comerciais não podem ser editados nesta versão. Corresponde à situação técnica `SOLD`.

### Venda

Registro definitivo da aquisição de um veículo por um comprador. Uma venda contém o veículo, o CPF do comprador, o preço da venda e a data da venda.

Cada veículo pode possuir no máximo uma venda. Cancelamento ou estorno de venda não fazem parte do escopo atual.

### CPF do comprador

Identificador fiscal informado no momento da venda. Deve conter 11 dígitos e passar pela validação dos dígitos verificadores.

O CPF completo não deve aparecer em logs, métricas ou mensagens de erro.

### Preço da venda

Valor preservado no momento em que a venda é registrada. Nesta versão, corresponde ao preço anunciado vigente no instante da venda.

Alterações futuras de preço não podem modificar um preço de venda já registrado.

### Data da venda

Data e hora em que a venda ocorreu. Não pode estar no futuro nem ser anterior à data de cadastro do veículo.

### Cadastro do veículo

Operação que inclui um novo veículo no catálogo com a situação Disponível. O cadastro produz um registro no histórico.

### Edição do veículo

Operação que altera um ou mais dados de um veículo disponível. A edição registra somente os campos efetivamente modificados.

Uma requisição que não modifica nenhum valor não deve gerar uma nova alteração no histórico.

### Registro da venda

Operação que associa uma única venda a um veículo disponível e altera sua situação para Vendido. A mudança do veículo, a criação da venda e a inclusão no histórico formam uma única operação atômica.

### Histórico do veículo

Sequência cronológica e imutável das mudanças relevantes ocorridas com um veículo desde seu cadastro.

O histórico registra criação, edição e venda. Ele não substitui o estado atual do veículo e não pode ser editado ou removido pelos fluxos comuns da aplicação.

### Alteração

Diferença efetiva entre o estado anterior e o novo estado de um veículo. Uma alteração informa o tipo do evento, os dados relevantes e o momento em que ocorreu.

### Data de criação

Momento em que um registro foi criado no sistema. Para o veículo, representa o instante do cadastro.

### Data de atualização

Momento da última mudança efetiva no estado do veículo. Consultas sem alteração não modificam essa data.

## Agregado principal

O **Veículo** é a raiz do agregado no contexto Gestão de Veículos. Toda mudança em seus dados, situação ou venda deve ocorrer por meio dessa raiz.

A Venda faz parte do ciclo de vida do Veículo no escopo atual. Mesmo que seja armazenada em uma tabela própria, ela não pode ser criada diretamente nem existir sem um veículo correspondente.

O Histórico do Veículo registra os fatos produzidos pelo agregado e deve ser persistido na mesma transação da mudança que o originou.

## Invariantes

As regras abaixo devem permanecer verdadeiras independentemente de a operação ter sido iniciada pela API, por um teste ou por outro adaptador:

1. Todo veículo possui um identificador único gerado pelo sistema.
2. Marca, modelo e cor são obrigatórios e não podem conter apenas espaços.
3. O ano de fabricação é inteiro, possui quatro dígitos e não é posterior ao próximo ano civil.
4. O preço anunciado é maior que zero e possui no máximo duas casas decimais.
5. Um veículo novo sempre começa como Disponível.
6. Somente um veículo disponível pode ser editado ou vendido.
7. A única transição de situação permitida nesta versão é de Disponível para Vendido.
8. Um veículo pode possuir no máximo uma venda.
9. O CPF do comprador deve ser válido antes do registro da venda.
10. A data da venda não pode estar no futuro nem ser anterior ao cadastro do veículo.
11. O preço da venda preserva o preço anunciado vigente no momento da operação.
12. Cadastro, edição e venda produzem histórico na mesma transação da mudança principal.
13. Registros do histórico são imutáveis.
14. Datas são armazenadas em UTC e expostas em ISO 8601.

## Vocabulário de operações

Use os seguintes verbos para representar intenções do negócio:

- **Cadastrar veículo**: incluir um novo veículo disponível no catálogo.
- **Editar veículo**: modificar dados de um veículo disponível.
- **Registrar venda**: vender um veículo disponível e preservar os dados da operação.
- **Listar veículos disponíveis**: consultar veículos que ainda podem ser vendidos.
- **Listar veículos vendidos**: consultar veículos que já possuem venda.
- **Consultar histórico**: recuperar as mudanças de um veículo em ordem cronológica.

Evite usar excluir, remover, cancelar, reservar ou reabrir como se fossem operações existentes. Esses comportamentos não pertencem ao escopo atual.

## Eventos do domínio

Os nomes abaixo representam fatos que já ocorreram:

- **Veículo cadastrado**: um veículo entrou no catálogo como disponível.
- **Veículo editado**: os dados de um veículo disponível foram alterados.
- **Veículo vendido**: uma venda foi registrada e o veículo deixou de estar disponível.

Os detalhes de comandos, eventos, políticas e pontos de atenção serão desenvolvidos no Event Storming.

## Correspondência com o código

O negócio e a documentação usam os termos em português. O código pode usar equivalentes em inglês desde que a correspondência permaneça estável:

- Veículo: `Vehicle`.
- Venda: `Sale`.
- Comprador: `Buyer`.
- Preço anunciado: `AskingPrice`.
- Preço da venda: `SalePrice`.
- Situação do veículo: `VehicleStatus`.
- Histórico do veículo: `VehicleHistory`.
- Cadastrar veículo: `CreateVehicle`.
- Editar veículo: `UpdateVehicle`.
- Registrar venda: `SellVehicle`.

Não use nomes diferentes para o mesmo conceito em camadas distintas.

## Exemplo de narrativa

Um Operador cadastra um Veículo com seus dados e preço anunciado. O Veículo passa a estar Disponível e o cadastro entra no Histórico do Veículo. Enquanto estiver Disponível, o Operador pode editar seus dados. Quando um Comprador adquire o Veículo, o Operador registra a Venda com o CPF e a data da venda. O sistema preserva o preço da venda, altera a situação para Vendido e registra o fato no histórico. A partir desse momento, o Veículo não pode ser editado nem vendido novamente.

## Decisões pendentes

Os seguintes assuntos precisam de decisão própria antes de serem implementados:

- paginação das listagens;
- autenticação e permissões do Operador;
- retenção e mascaramento do CPF nas respostas;
- cancelamento ou estorno de venda;
- reserva de veículo;
- exclusão lógica de veículo.
