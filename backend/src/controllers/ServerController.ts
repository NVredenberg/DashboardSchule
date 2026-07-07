import type { NextFunction, Request, Response } from 'express';

import type { ServerService } from '../services/ServerService.js';

export class ServerController {
  public constructor(private readonly serverService: ServerService) {}

  public getServer = (_request: Request, response: Response, next: NextFunction): void => {
    try {
      response.status(200).json(this.serverService.getServer());
    } catch (error) {
      next(error);
    }
  };

  public startServer = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      response.status(200).json(await this.serverService.startServer());
    } catch (error) {
      next(error);
    }
  };
}
