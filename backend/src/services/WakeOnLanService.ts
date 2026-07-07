import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { promisify } from 'node:util';

import wakeOnLan from 'wake_on_lan';

import type { StartServerResponse } from '../types/StartServerResponse.js';
import type { ServerConfig } from '../types/ServerConfig.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const MAC_ADDRESS_PATTERN = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i;
const DEFAULT_WAKE_COMMAND = 'wakeonlan';
const DEFAULT_WAKE_PORT = 9;
const WAKE_COMMAND_TIMEOUT_MS = 10000;

const execAsync = promisify(exec);

type WakeOptions = {
  address?: string;
  port: number;
};

export class WakeOnLanService {
  public async sendMagicPacket(serverConfig: ServerConfig): Promise<StartServerResponse> {
    if (!this.isValidMacAddress(serverConfig.mac)) {
      throw this.createWakeOnLanError('Ungueltige MAC-Adresse in der Serverkonfiguration');
    }

    try {
      const wakeMethod = await this.wake(serverConfig);

      logger.info('Wake-on-LAN packet sent', {
        broadcastAddress: this.getBroadcastAddress(serverConfig),
        method: wakeMethod,
        serverName: serverConfig.serverName,
        serverIp: serverConfig.ip,
        wakeCommand: serverConfig.wakeCommand ?? DEFAULT_WAKE_COMMAND,
        wakePort: serverConfig.wakePort ?? DEFAULT_WAKE_PORT,
      });

      return {
        success: true,
        message: 'Startsignal wurde an Gandalf gesendet',
      };
    } catch (error) {
      logger.error('Wake-on-LAN packet failed', {
        error: error instanceof Error ? error.message : String(error),
        serverName: serverConfig.serverName,
        serverIp: serverConfig.ip,
      });

      throw this.createWakeOnLanError('Startsignal konnte nicht gesendet werden', error);
    }
  }

  private async wake(serverConfig: ServerConfig): Promise<'command' | 'node-library'> {
    try {
      await this.sendWakeCommand(serverConfig);

      return 'command';
    } catch (error) {
      if (!this.canFallBackToNodeLibrary(serverConfig, error)) {
        throw error;
      }

      logger.warn('wakeonlan command is unavailable, falling back to Node Wake-on-LAN library', {
        error: error instanceof Error ? error.message : String(error),
        wakeCommand: DEFAULT_WAKE_COMMAND,
      });

      await this.sendWakePacket(serverConfig.mac, this.getWakeOptions(serverConfig));

      return 'node-library';
    }
  }

  private async sendWakeCommand(serverConfig: ServerConfig): Promise<void> {
    const command = [
      this.escapeShellArgument(serverConfig.wakeCommand ?? DEFAULT_WAKE_COMMAND),
      this.escapeShellArgument(serverConfig.mac),
    ].join(' ');

    await execAsync(command, {
      timeout: WAKE_COMMAND_TIMEOUT_MS,
      windowsHide: true,
    });
  }

  private sendWakePacket(macAddress: string, options: WakeOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      wakeOnLan.wake(macAddress, options, (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private getWakeOptions(serverConfig: ServerConfig): WakeOptions {
    return {
      address: this.getBroadcastAddress(serverConfig),
      port: serverConfig.wakePort ?? DEFAULT_WAKE_PORT,
    };
  }

  private getBroadcastAddress(serverConfig: ServerConfig): string | undefined {
    return serverConfig.broadcastAddress ?? this.getDefaultIpv4BroadcastAddress(serverConfig.ip);
  }

  private getDefaultIpv4BroadcastAddress(ipAddress: string): string | undefined {
    const octets = ipAddress.split('.');

    if (octets.length !== 4 || !octets.every((octet) => /^\d{1,3}$/.test(octet))) {
      return undefined;
    }

    return `${octets[0]}.${octets[1]}.${octets[2]}.255`;
  }

  private isValidMacAddress(macAddress: string): boolean {
    return MAC_ADDRESS_PATTERN.test(macAddress);
  }

  private escapeShellArgument(value: string): string {
    if (platform() === 'win32') {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return `'${value.replace(/'/g, "'\\''")}'`;
  }

  private canFallBackToNodeLibrary(serverConfig: ServerConfig, error: unknown): boolean {
    return serverConfig.wakeCommand === undefined && this.isCommandUnavailable(error);
  }

  private isCommandUnavailable(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      'code' in error ||
      /not recognized|not found|not found as an internal or external command|ENOENT/i.test(
        error.message,
      )
    );
  }

  private createWakeOnLanError(message: string, cause?: unknown): AppError {
    return new AppError(message, 500, cause, {
      success: false,
      message,
    });
  }
}
