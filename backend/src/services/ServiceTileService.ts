import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  serviceIconNames,
  type ServiceIconName,
  type ServiceTile,
  type ServiceTilesConfig,
  type ServiceTilesResponse,
} from '../types/ServiceTile.js';
import { AppError } from '../utils/AppError.js';

const serviceIconNameSet = new Set<ServiceIconName>(serviceIconNames);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && 'code' in error;

export class ServiceTileService {
  private readonly serviceTilesPath: string;

  public constructor() {
    const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

    this.serviceTilesPath = resolve(backendRoot, 'config/service-tiles.json');
  }

  public async getServiceTiles(): Promise<ServiceTilesResponse> {
    return {
      services: await this.readServiceTiles(),
    };
  }

  public async saveServiceTiles(value: unknown): Promise<ServiceTilesResponse> {
    const services = this.parseServiceTiles(value);

    await mkdir(dirname(this.serviceTilesPath), { recursive: true });
    await writeFile(
      this.serviceTilesPath,
      `${JSON.stringify({ services, version: 1 } satisfies ServiceTilesConfig, null, 2)}\n`,
      'utf8',
    );

    return {
      services,
    };
  }

  private async readServiceTiles(): Promise<ServiceTile[]> {
    try {
      const fileContent = await readFile(this.serviceTilesPath, 'utf8');
      const serviceTilesConfig = JSON.parse(fileContent) as unknown;

      if (
        !isRecord(serviceTilesConfig) ||
        serviceTilesConfig.version !== 1 ||
        !Array.isArray(serviceTilesConfig.services)
      ) {
        throw new AppError('Invalid service tile configuration', 500);
      }

      return this.parseServiceTiles(serviceTilesConfig.services);
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return [];
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Could not load service tile configuration', 500, error);
    }
  }

  private parseServiceTiles(value: unknown): ServiceTile[] {
    if (!Array.isArray(value)) {
      throw new AppError('Invalid service tile payload', 400);
    }

    const seenIds = new Set<string>();

    return value.map((item) => {
      const serviceTile = this.parseServiceTile(item);

      if (seenIds.has(serviceTile.id)) {
        throw new AppError('Duplicate service tile id', 400);
      }

      seenIds.add(serviceTile.id);

      return serviceTile;
    });
  }

  private parseServiceTile(value: unknown): ServiceTile {
    if (!isRecord(value)) {
      throw new AppError('Invalid service tile payload', 400);
    }

    const id = this.parseNonEmptyString(value.id);
    const href = this.parseHttpUrl(value.href);
    const icon = this.parseServiceIconName(value.icon);
    const name = this.parseNonEmptyString(value.name);

    return {
      href,
      icon,
      id,
      name,
    };
  }

  private parseNonEmptyString(value: unknown): string {
    if (typeof value !== 'string') {
      throw new AppError('Invalid service tile payload', 400);
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      throw new AppError('Invalid service tile payload', 400);
    }

    return trimmedValue;
  }

  private parseHttpUrl(value: unknown): string {
    const href = this.parseNonEmptyString(value);

    try {
      const url = new URL(href);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new AppError('Invalid service tile URL', 400);
      }

      return url.toString().replace(/\/$/, '');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Invalid service tile URL', 400, error);
    }
  }

  private parseServiceIconName(value: unknown): ServiceIconName {
    if (typeof value === 'string' && serviceIconNameSet.has(value as ServiceIconName)) {
      return value as ServiceIconName;
    }

    throw new AppError('Invalid service tile icon', 400);
  }
}
