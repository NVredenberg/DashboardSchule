import wakeOnLan from 'wake_on_lan';

import type { StartServerResponse } from '../types/StartServerResponse.js';
import type { ServerConfig } from '../types/ServerConfig.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const MAC_ADDRESS_PATTERN = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i;
const DEFAULT_WAKE_PORT = 9;

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
      await this.sendWakePacket(serverConfig.mac, this.getWakeOptions(serverConfig));

      logger.info('Wake-on-LAN packet sent', {
        broadcastAddress: this.getBroadcastAddress(serverConfig),
        serverName: serverConfig.serverName,
        serverIp: serverConfig.ip,
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

  private createWakeOnLanError(message: string, cause?: unknown): AppError {
    return new AppError(message, 500, cause, {
      success: false,
      message,
    });
  }
}
