import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { promisify } from 'node:util';

import type { StartServerResponse } from '../types/StartServerResponse.js';
import type { ServerConfig } from '../types/ServerConfig.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const MAC_ADDRESS_PATTERN = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i;
const DEFAULT_WAKE_COMMAND = 'wakeonlan';
const WAKE_COMMAND_TIMEOUT_MS = 10000;

const execAsync = promisify(exec);

export class WakeOnLanService {
  public async sendMagicPacket(serverConfig: ServerConfig): Promise<StartServerResponse> {
    if (!this.isValidMacAddress(serverConfig.mac)) {
      throw this.createWakeOnLanError('Ungueltige MAC-Adresse in der Serverkonfiguration');
    }

    const command = this.buildWakeCommand(serverConfig);

    try {
      await this.sendWakeCommand(command);

      logger.info('Wake-on-LAN packet sent', {
        command,
        serverName: serverConfig.serverName,
        serverIp: serverConfig.ip,
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
        wakeCommand: command,
      });

      throw this.createWakeOnLanError(this.getWakeFailureMessage(error), error);
    }
  }

  private buildWakeCommand(serverConfig: ServerConfig): string {
    const wakeCommand = serverConfig.wakeCommand?.trim() || DEFAULT_WAKE_COMMAND;
    const escapedMacAddress = this.escapeShellArgument(serverConfig.mac);

    if (wakeCommand.includes('{mac}')) {
      return wakeCommand.replaceAll('{mac}', escapedMacAddress);
    }

    return `${this.escapeShellCommand(wakeCommand)} ${escapedMacAddress}`;
  }

  private async sendWakeCommand(command: string): Promise<void> {
    await execAsync(command, {
      timeout: WAKE_COMMAND_TIMEOUT_MS,
      windowsHide: true,
    });
  }

  private isValidMacAddress(macAddress: string): boolean {
    return MAC_ADDRESS_PATTERN.test(macAddress);
  }

  private escapeShellCommand(value: string): string {
    if (/^[\w.-]+$/.test(value)) {
      return value;
    }

    return this.escapeShellArgument(value);
  }

  private escapeShellArgument(value: string): string {
    if (platform() === 'win32') {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return `'${value.replace(/'/g, "'\\''")}'`;
  }

  private getWakeFailureMessage(error: unknown): string {
    const detail = this.getCommandErrorDetail(error);

    if (detail === null) {
      return 'Startsignal konnte nicht gesendet werden';
    }

    return `Startsignal konnte nicht gesendet werden: ${detail}`;
  }

  private getCommandErrorDetail(error: unknown): string | null {
    if (typeof error !== 'object' || error === null) {
      return null;
    }

    const commandError = error as Error & {
      code?: unknown;
      stderr?: unknown;
      stdout?: unknown;
    };
    const stderr = typeof commandError.stderr === 'string' ? commandError.stderr.trim() : '';
    const stdout = typeof commandError.stdout === 'string' ? commandError.stdout.trim() : '';

    if (stderr.length > 0) {
      return stderr;
    }

    if (stdout.length > 0) {
      return stdout;
    }

    if (commandError.message.length > 0) {
      return commandError.message;
    }

    return commandError.code === undefined ? null : String(commandError.code);
  }

  private createWakeOnLanError(message: string, cause?: unknown): AppError {
    return new AppError(message, 500, cause, {
      success: false,
      message,
    });
  }
}
