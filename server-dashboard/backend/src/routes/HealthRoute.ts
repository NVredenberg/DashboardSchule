import { Router } from 'express';

import type { HealthController } from '../controllers/HealthController.js';

export const createHealthRoute = (healthController: HealthController): Router => {
  const healthRoute = Router();

  healthRoute.get('/health', healthController.getHealth);

  return healthRoute;
};

