import { Router } from 'express';

import type { ServiceTileController } from '../controllers/ServiceTileController.js';

export const createServiceTileRoute = (serviceTileController: ServiceTileController): Router => {
  const serviceTileRoute = Router();

  serviceTileRoute.get('/services', serviceTileController.getServiceTiles);
  serviceTileRoute.put('/services', serviceTileController.putServiceTiles);

  return serviceTileRoute;
};
