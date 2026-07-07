import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ServerConfig } from '../types/ServerConfig.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

type PackageJson = {
  version: string;
};

export class ConfigService {
  private readonly appVersion: string;
  private readonly serverConfig: ServerConfig;

  public constructor() {
    const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

    this.appVersion = this.loadAppVersion(resolve(backendRoot, 'package.json'));
    this.serverConfig = this.loadServerConfig(resolve(backendRoot, 'config/server.json'));

    logger.info('Backend configuration loaded');
  }

  public getAppVersion(): string {
    return this.appVersion;
  }

  public getServerConfig(): ServerConfig {
    return this.serverConfig;
  }

  private loadAppVersion(packageJsonPath: string): string {
    const packageJson = this.readJsonFile<PackageJson>(packageJsonPath);

    if (!this.isNonEmptyString(packageJson.version)) {
      throw new AppError('Invalid package version configuration', 500);
    }

    return packageJson.version;
  }

  private loadServerConfig(serverConfigPath: string): ServerConfig {
    const serverConfig = this.readJsonFile<ServerConfig>(serverConfigPath);

    if (!this.isValidServerConfig(serverConfig)) {
      throw new AppError('Invalid server configuration', 500);
    }

    return serverConfig;
  }

  private readJsonFile<T>(filePath: string): T {
    try {
      return JSON.parse(readFileSync(filePath, 'utf8')) as T;
    } catch (error) {
      throw new AppError(`Could not load configuration file: ${filePath}`, 500, error);
    }
  }

  private isValidServerConfig(config: ServerConfig): boolean {
    return (
      this.isNonEmptyString(config.serverName) &&
      this.isNonEmptyString(config.ip) &&
      this.isNonEmptyString(config.mac) &&
      Number.isInteger(config.refreshInterval) &&
      config.refreshInterval > 0 &&
      this.isValidOptionalString(config.broadcastAddress) &&
      this.isValidOptionalPort(config.wakePort)
    );
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isValidOptionalString(value: unknown): boolean {
    return value === undefined || this.isNonEmptyString(value);
  }

  private isValidOptionalPort(value: unknown): boolean {
    return (
      value === undefined ||
      (typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 65535)
    );
  }
}
