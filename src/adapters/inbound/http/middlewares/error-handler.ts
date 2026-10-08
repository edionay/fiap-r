import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ValidateError } from '@tsoa/runtime';

interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

export const notFoundHandler: RequestHandler = (_request, response) => {
  const body: ErrorResponse = {
    code: 'ROUTE_NOT_FOUND',
    message: 'Route not found.',
  };

  response.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (error instanceof ValidateError) {
    const body: ErrorResponse = {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: error.fields,
    };

    response.status(422).json(body);
    return;
  }

  const body: ErrorResponse = {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  };

  response.status(500).json(body);
};
