import type { ErrorRequestHandler } from 'express';

import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  void _next;

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Internal server error';

  logger.error('Request failed', {
    method: request.method,
    path: request.originalUrl,
    statusCode,
    error: error instanceof Error ? error.message : String(error),
  });

  response.status(statusCode).json(
    error instanceof AppError && error.responseBody
      ? error.responseBody
      : {
          error: {
            message,
          },
        },
  );
};
