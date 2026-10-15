exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.alterColumn('historico_veiculos', 'id', {
    default: pgm.func('gen_random_uuid()'),
  });
  pgm.dropColumn('historico_veiculos', 'alteracoes');
};

exports.down = (pgm) => {
  pgm.addColumn('historico_veiculos', {
    alteracoes: {
      type: 'jsonb',
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
  });
  pgm.alterColumn('historico_veiculos', 'id', {
    default: null,
  });
};
