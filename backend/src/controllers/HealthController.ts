import type { NextFunction, Request, Response } from 'express';

import type { HealthService } from '../services/HealthService.js';

export class HealthController {
  public constructor(private readonly healthService: HealthService) {}

  public getHealth = (_request: Request, response: Response, next: NextFunction): void => {
    try {
      response.status(200).json(this.healthService.getHealth());
    } catch (error) {
      next(error);
    }
  };
}

