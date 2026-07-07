import type { RequestHandler } from 'express';

import { logger } from '../utils/logger.js';

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = Date.now();

  response.on('finish', () => {
    logger.info('HTTP request completed', {
      durationMs: Date.now() - startedAt,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
    });
  });

  next();
};

