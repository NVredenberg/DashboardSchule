import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.port, () => {
  logger.info('Backend listening', { port: env.port });
});

server.on('error', (error) => {
  logger.error('Backend failed to start', {
    error: error instanceof Error ? error.message : String(error),
  });
});
