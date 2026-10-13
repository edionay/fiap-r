import type {
  IocContainer,
  IocContainerFactory,
  ServiceIdentifier,
} from '@tsoa/runtime';
import type { Request } from 'express';
import type { DependenciasAplicacao } from '../adapters/inbound/http/app';
import { ProntidaoController } from '../adapters/inbound/http/controllers/prontidao.controller';

type ConstrutorSemArgumentos<T> = new () => T;

export const iocContainer: IocContainerFactory<Request> = (requisicao) => {
  const fabrica: IocContainer = {
    get<T>(identificador: ServiceIdentifier<T>): T {
      if (
        identificador ===
        (ProntidaoController as ServiceIdentifier<T>)
      ) {
        const dependencias = requisicao.app.locals
          .dependencias as DependenciasAplicacao | undefined;

        if (dependencias === undefined) {
          throw new Error(
            'As dependências da aplicação não foram configuradas.',
          );
        }

        return new ProntidaoController(
          dependencias.obterEstadoDeProntidao,
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
