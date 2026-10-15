exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropColumn('vendas', 'preco_venda');
};

exports.down = (pgm) => {
  pgm.addColumn('vendas', {
    preco_venda: { type: 'numeric(12,2)' },
  });
  pgm.sql(`
    UPDATE vendas
    SET preco_venda = veiculos.preco_anunciado
    FROM veiculos
    WHERE veiculos.id = vendas.veiculo_id
  `);
  pgm.alterColumn('vendas', 'preco_venda', { notNull: true });
  pgm.addConstraint('vendas', 'vendas_preco_venda_positivo', {
    check: 'preco_venda > 0',
  });
  pgm.createIndex('vendas', ['preco_venda', 'veiculo_id'], {
    name: 'vendas_preco_veiculo_idx',
  });
};
