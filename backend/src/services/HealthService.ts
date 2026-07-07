import type { HealthResponse } from '../types/HealthResponse.js';
import type { ConfigService } from './ConfigService.js';

export class HealthService {
  public constructor(private readonly configService: ConfigService) {}

  public getHealth(): HealthResponse {
    return {
      status: 'ok',
      version: this.configService.getAppVersion(),
    };
  }
}

