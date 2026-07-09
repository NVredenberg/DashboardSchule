import type { NextFunction, Request, Response } from 'express';

import type { ServiceTileService } from '../services/ServiceTileService.js';

const isServiceTilesRequestBody = (value: unknown): value is { services: unknown } =>
  typeof value === 'object' && value !== null && 'services' in value;

export class ServiceTileController {
  public constructor(private readonly serviceTileService: ServiceTileService) {}

  public getServiceTiles = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      response.status(200).json(await this.serviceTileService.getServiceTiles());
    } catch (error) {
      next(error);
    }
  };

  public putServiceTiles = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const requestBody = request.body as unknown;
      const services = isServiceTilesRequestBody(requestBody) ? requestBody.services : null;

      response.status(200).json(await this.serviceTileService.saveServiceTiles(services));
    } catch (error) {
      next(error);
    }
  };
}
