import wakeOnLan from 'wake_on_lan';

import type { StartServerResponse } from '../types/StartServerResponse.js';
import type { ServerConfig } from '../types/ServerConfig.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const MAC_ADDRESS_PATTERN = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i;

export class WakeOnLanService {
  public async sendMagicPacket(serverConfig: ServerConfig): Promise<StartServerResponse> {
    if (!this.isValidMacAddress(serverConfig.mac)) {
      throw this.createWakeOnLanError('Invalid MAC address in server configuration');
    }

    try {
      await this.wake(serverConfig.mac);

      logger.info('Wake-on-LAN packet sent', {
        serverName: serverConfig.serverName,
        serverIp: serverConfig.ip,
      });

      return {
        success: true,
        message: 'Wake-on-LAN packet sent',
      };
    } catch (error) {
      logger.error('Wake-on-LAN packet failed', {
        error: error instanceof Error ? error.message : String(error),
        serverName: serverConfig.serverName,
        serverIp: serverConfig.ip,
      });

      throw this.createWakeOnLanError('Wake-on-LAN packet could not be sent', error);
    }
  }

  private wake(macAddress: string): Promise<void> {
    return new Promise((resolve, reject) => {
      wakeOnLan.wake(macAddress, (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private isValidMacAddress(macAddress: string): boolean {
    return MAC_ADDRESS_PATTERN.test(macAddress);
  }

  private createWakeOnLanError(message: string, cause?: unknown): AppError {
    return new AppError(message, 500, cause, {
      success: false,
      message,
    });
  }
}

