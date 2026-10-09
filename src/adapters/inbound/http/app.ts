import express, { type Express } from 'express';
import { RegisterRoutes } from './generated/routes';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  RegisterRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
