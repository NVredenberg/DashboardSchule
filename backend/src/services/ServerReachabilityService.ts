import { execFile } from 'node:child_process';
import { platform } from 'node:os';
import { promisify } from 'node:util';

import type { ServerConfig } from '../types/ServerConfig.js';
import { logger } from '../utils/logger.js';

const execFileAsync = promisify(execFile);
const DEFAULT_ONLINE_CHECK_TIMEOUT_MS = 1500;

export class ServerReachabilityService {
  public async isOnline(serverConfig: ServerConfig): Promise<boolean> {
    const timeoutMs = serverConfig.onlineCheckTimeoutMs ?? DEFAULT_ONLINE_CHECK_TIMEOUT_MS;

    try {
      await execFileAsync('ping', this.getPingArguments(serverConfig.ip, timeoutMs), {
        timeout: timeoutMs + 500,
        windowsHide: true,
      });

      return true;
    } catch (error) {
      if (this.isPingCommandUnavailable(error)) {
        logger.warn('Ping command is unavailable for server status check', {
          error: error instanceof Error ? error.message : String(error),
          serverIp: serverConfig.ip,
        });
      }

      return false;
    }
  }

  private getPingArguments(ipAddress: string, timeoutMs: number): string[] {
    if (platform() === 'win32') {
      return ['-n', '1', '-w', String(timeoutMs), ipAddress];
    }

    return ['-c', '1', '-W', String(Math.max(1, Math.ceil(timeoutMs / 1000))), ipAddress];
  }

  private isPingCommandUnavailable(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    );
  }
}
