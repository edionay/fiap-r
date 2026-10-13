exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType('situacao_veiculo', ['DISPONIVEL', 'VENDIDO']);

  pgm.createTable('veiculos', {
    id: { type: 'uuid', primaryKey: true },
    marca: { type: 'varchar(100)', notNull: true },
    modelo: { type: 'varchar(100)', notNull: true },
    ano_fabricacao: { type: 'smallint', notNull: true },
    cor: { type: 'varchar(50)', notNull: true },
    preco_anunciado: { type: 'numeric(12,2)', notNull: true },
    situacao: {
      type: 'situacao_veiculo',
      notNull: true,
      default: 'DISPONIVEL',
    },
    criado_em: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    atualizado_em: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('veiculos', 'veiculos_ano_fabricacao_valido', {
    check: 'ano_fabricacao BETWEEN 1886 AND 9999',
  });
  pgm.addConstraint('veiculos', 'veiculos_preco_anunciado_positivo', {
    check: 'preco_anunciado > 0',
  });
  pgm.createIndex('veiculos', ['situacao', 'preco_anunciado', 'id'], {
    name: 'veiculos_situacao_preco_idx',
  });

  pgm.createTable('vendas', {
    id: { type: 'uuid', primaryKey: true },
    veiculo_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'veiculos',
      onDelete: 'RESTRICT',
    },
    cpf_comprador: { type: 'char(11)', notNull: true },
    preco_venda: { type: 'numeric(12,2)', notNull: true },
    vendido_em: { type: 'timestamptz', notNull: true },
    criado_em: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('vendas', 'vendas_cpf_comprador_valido', {
    check: "cpf_comprador ~ '^[0-9]{11}$'",
  });
  pgm.addConstraint('vendas', 'vendas_preco_venda_positivo', {
    check: 'preco_venda > 0',
  });
  pgm.createIndex('vendas', ['preco_venda', 'veiculo_id'], {
    name: 'vendas_preco_veiculo_idx',
  });

  pgm.createTable('historico_veiculos', {
    id: { type: 'uuid', primaryKey: true },
    veiculo_id: {
      type: 'uuid',
      notNull: true,
      references: 'veiculos',
      onDelete: 'RESTRICT',
    },
    tipo_evento: { type: 'varchar(30)', notNull: true },
    alteracoes: { type: 'jsonb', notNull: true },
    ocorrido_em: { type: 'timestamptz', notNull: true },
  });

  pgm.addConstraint(
    'historico_veiculos',
    'historico_veiculos_tipo_evento_valido',
    {
      check:
        "tipo_evento IN ('VEICULO_CADASTRADO', 'VEICULO_EDITADO', 'VEICULO_VENDIDO')",
    },
  );
  pgm.createIndex(
    'historico_veiculos',
    ['veiculo_id', 'ocorrido_em', 'id'],
    { name: 'historico_veiculos_veiculo_data_idx' },
  );
};

exports.down = (pgm) => {
  pgm.dropTable('historico_veiculos');
  pgm.dropTable('vendas');
  pgm.dropTable('veiculos');
  pgm.dropType('situacao_veiculo');
};
