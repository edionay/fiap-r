import { describe, expect, it } from 'vitest';
import { carregarConfiguracao, obterPorta } from '../../../src/config/env';

describe('obterPorta', () => {
  it('retorna a porta padrão quando o valor não é informado', () => {
    expect(obterPorta(undefined)).toBe(3000);
  });

  it('retorna a porta configurada quando o valor é válido', () => {
    expect(obterPorta('8080')).toBe(8080);
  });

  it.each(['0', '65536', '3000.5', 'inválida'])(
    'rejeita uma porta inválida: %s',
    (valor) => {
      expect(() => obterPorta(valor)).toThrow(
        'PORT deve ser um número inteiro entre 1 e 65535.',
      );
    },
  );
});

describe('carregarConfiguracao', () => {
  it('carrega a configuração do banco de dados com valores padrão', () => {
    const configuracao = carregarConfiguracao({
      DATABASE_URL: 'postgresql://usuario:senha@localhost:5432/banco',
    });

    expect(configuracao).toEqual({
      porta: 3000,
      bancoDados: {
        stringConexao:
          'postgresql://usuario:senha@localhost:5432/banco',
        limiteConexoes: 10,
        tempoInatividadeMs: 10000,
        tempoConexaoMs: 5000,
      },
    });
  });

  it('rejeita a ausência da URL do banco de dados', () => {
    expect(() => carregarConfiguracao({})).toThrow(
      'DATABASE_URL é obrigatória.',
    );
  });

  it.each(['inválida', 'http://localhost/banco'])(
    'rejeita uma URL inválida do banco de dados: %s',
    (urlBancoDados) => {
      expect(() =>
        carregarConfiguracao({ DATABASE_URL: urlBancoDados }),
      ).toThrow('DATABASE_URL deve ser uma URL válida do PostgreSQL.');
    },
  );

  it('rejeita configurações inválidas do pool', () => {
    expect(() =>
      carregarConfiguracao({
        DATABASE_URL: 'postgresql://usuario:senha@localhost:5432/banco',
        DB_MAX_CONNECTIONS: '0',
      }),
    ).toThrow('DB_MAX_CONNECTIONS deve ser um número inteiro positivo.');
  });
});
