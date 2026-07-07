import { Router } from 'express';

import type { ServerController } from '../controllers/ServerController.js';

export const createServerRoute = (serverController: ServerController): Router => {
  const serverRoute = Router();

  serverRoute.get('/server', serverController.getServer);
  serverRoute.post('/server/start', serverController.startServer);

  return serverRoute;
};
