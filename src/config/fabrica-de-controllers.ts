import type {
  IocContainer,
  IocContainerFactory,
  ServiceIdentifier,
} from '@tsoa/runtime';
import type { Request } from 'express';
import type { DependenciasAplicacao } from '../adapters/inbound/http/app';
import { ConsultasVeiculosController } from '../adapters/inbound/http/controllers/consultas-veiculos.controller';
import { EdicaoVeiculosController } from '../adapters/inbound/http/controllers/edicao-veiculos.controller';
import { ProntidaoController } from '../adapters/inbound/http/controllers/prontidao.controller';
import { VeiculosController } from '../adapters/inbound/http/controllers/veiculos.controller';
import { VendasController } from '../adapters/inbound/http/controllers/vendas.controller';

type ConstrutorSemArgumentos<T> = new () => T;

export const iocContainer: IocContainerFactory<Request> = (requisicao) => {
  const fabrica: IocContainer = {
    get<T>(identificador: ServiceIdentifier<T>): T {
      if (
        identificador ===
        (ProntidaoController as ServiceIdentifier<T>)
      ) {
        const dependencias = requisicao.app.locals
          .dependencias as Partial<DependenciasAplicacao> | undefined;

        if (dependencias?.obterEstadoDeProntidao === undefined) {
          throw new Error(
            'A dependência de prontidão não foi configurada.',
          );
        }

        return new ProntidaoController(
          dependencias.obterEstadoDeProntidao,
        ) as unknown as T;
      }

      if (
        identificador === (VeiculosController as ServiceIdentifier<T>)
      ) {
        const dependencias = requisicao.app.locals
          .dependencias as Partial<DependenciasAplicacao> | undefined;

        if (dependencias?.cadastrarVeiculo === undefined) {
          throw new Error(
            'A dependência de cadastro de veículo não foi configurada.',
          );
        }

        return new VeiculosController(
          dependencias.cadastrarVeiculo,
        ) as unknown as T;
      }

      if (
        identificador ===
        (ConsultasVeiculosController as ServiceIdentifier<T>)
      ) {
        const dependencias = requisicao.app.locals
          .dependencias as Partial<DependenciasAplicacao> | undefined;

        if (dependencias?.listarVeiculos === undefined) {
          throw new Error(
            'A dependência de consulta de veículos não foi configurada.',
          );
        }

        return new ConsultasVeiculosController(
          dependencias.listarVeiculos,
        ) as unknown as T;
      }

      if (
        identificador ===
        (EdicaoVeiculosController as ServiceIdentifier<T>)
      ) {
        const dependencias = requisicao.app.locals
          .dependencias as Partial<DependenciasAplicacao> | undefined;

        if (dependencias?.editarVeiculo === undefined) {
          throw new Error(
            'A dependência de edição de veículo não foi configurada.',
          );
        }

        return new EdicaoVeiculosController(
          dependencias.editarVeiculo,
        ) as unknown as T;
      }

      if (identificador === (VendasController as ServiceIdentifier<T>)) {
        const dependencias = requisicao.app.locals
          .dependencias as Partial<DependenciasAplicacao> | undefined;

        if (dependencias?.registrarVenda === undefined) {
          throw new Error(
            'A dependência de registro de venda não foi configurada.',
          );
        }

        return new VendasController(
          dependencias.registrarVenda,
        ) as unknown as T;
      }

      if (typeof identificador !== 'function') {
        throw new Error('O controller solicitado não pode ser instanciado.');
      }

      const ConstrutorController =
        identificador as ConstrutorSemArgumentos<T>;
      return new ConstrutorController();
    },
  };

  return fabrica;
};
