import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { promisify } from 'node:util';

import type { StartServerResponse } from '../types/StartServerResponse.js';
import type { ServerConfig } from '../types/ServerConfig.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const MAC_ADDRESS_PATTERN = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i;
const DEFAULT_WAKE_COMMAND = 'wake -a {broadcastAddress} -p {port} {mac}';
const DEFAULT_WAKE_PORT = 9;
const WAKE_COMMAND_TIMEOUT_MS = 10000;
const WAKE_RELAY_TIMEOUT_MS = 10000;

type WakeRelayRequestBody = {
  broadcastAddress: string;
  mac: string;
  serverIp: string;
  serverName: string;
  wakePort: number;
};

type WakeRelayResponseBody = {
  error?: {
    message?: string;
  };
  message?: string;
  success?: boolean;
};

const execAsync = promisify(exec);

export class WakeOnLanService {
  public async sendMagicPacket(serverConfig: ServerConfig): Promise<StartServerResponse> {
    this.assertValidMacAddress(serverConfig.mac);

    const wakeRelayUrl = serverConfig.wakeRelayUrl?.trim();

    if (wakeRelayUrl) {
      return this.sendWakeRelayRequest(serverConfig, wakeRelayUrl);
    }

    return this.sendMagicPacketDirect(serverConfig);
  }

  public async sendMagicPacketDirect(serverConfig: ServerConfig): Promise<StartServerResponse> {
    this.assertValidMacAddress(serverConfig.mac);

    const command = this.buildWakeCommand(serverConfig);

    try {
      await this.sendWakeCommand(command);

      logger.info('Wake-on-LAN packet sent directly', {
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

  private async sendWakeRelayRequest(
    serverConfig: ServerConfig,
    wakeRelayUrl: string,
  ): Promise<StartServerResponse> {
    if (!this.isValidMacAddress(serverConfig.mac)) {
      throw this.createWakeOnLanError('Ungueltige MAC-Adresse in der Serverkonfiguration');
    }

    const requestBody: WakeRelayRequestBody = {
      broadcastAddress: this.getBroadcastAddress(serverConfig) ?? '255.255.255.255',
      mac: serverConfig.mac,
      serverIp: serverConfig.ip,
      serverName: serverConfig.serverName,
      wakePort: serverConfig.wakePort ?? DEFAULT_WAKE_PORT,
    };
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), WAKE_RELAY_TIMEOUT_MS);

    try {
      const response = await fetch(wakeRelayUrl, {
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        signal: abortController.signal,
      });
      const relayResponse = await this.parseWakeRelayResponse(response);

      if (!response.ok) {
        throw new Error(this.getWakeRelayResponseMessage(response, relayResponse));
      }

      logger.info('Wake-on-LAN relay accepted request', {
        wakeRelayUrl,
        serverName: serverConfig.serverName,
        serverIp: serverConfig.ip,
      });

      return {
        success: relayResponse.success ?? true,
        message: relayResponse.message ?? 'Startsignal wurde an Gandalf gesendet',
      };
    } catch (error) {
      logger.error('Wake-on-LAN relay request failed', {
        error: error instanceof Error ? error.message : String(error),
        serverName: serverConfig.serverName,
        serverIp: serverConfig.ip,
        wakeRelayUrl,
      });

      throw this.createWakeOnLanError(this.getWakeRelayFailureMessage(error), error);
    } finally {
      clearTimeout(timeout);
    }
  }

  private assertValidMacAddress(macAddress: string): void {
    if (!this.isValidMacAddress(macAddress)) {
      throw this.createWakeOnLanError('Ungueltige MAC-Adresse in der Serverkonfiguration');
    }
  }

  private buildWakeCommand(serverConfig: ServerConfig): string {
    const wakeCommand = serverConfig.wakeCommand?.trim() || DEFAULT_WAKE_COMMAND;
    const escapedMacAddress = this.escapeShellArgument(serverConfig.mac);
    const escapedBroadcastAddress = this.escapeShellArgument(
      this.getBroadcastAddress(serverConfig) ?? '255.255.255.255',
    );
    const escapedWakePort = this.escapeShellArgument(
      String(serverConfig.wakePort ?? DEFAULT_WAKE_PORT),
    );

    if (
      wakeCommand.includes('{broadcastAddress}') ||
      wakeCommand.includes('{mac}') ||
      wakeCommand.includes('{port}')
    ) {
      return wakeCommand
        .replaceAll('{broadcastAddress}', escapedBroadcastAddress)
        .replaceAll('{mac}', escapedMacAddress)
        .replaceAll('{port}', escapedWakePort);
    }

    return `${this.escapeShellCommand(wakeCommand)} ${escapedMacAddress}`;
  }

  private async sendWakeCommand(command: string): Promise<void> {
    await execAsync(command, {
      timeout: WAKE_COMMAND_TIMEOUT_MS,
      windowsHide: true,
    });
  }

  private async parseWakeRelayResponse(response: Response): Promise<WakeRelayResponseBody> {
    const responseText = await response.text();

    if (responseText.trim().length === 0) {
      return {};
    }

    try {
      return JSON.parse(responseText) as WakeRelayResponseBody;
    } catch {
      return {
        message: responseText,
      };
    }
  }

  private isValidMacAddress(macAddress: string): boolean {
    return MAC_ADDRESS_PATTERN.test(macAddress);
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

  private getWakeRelayFailureMessage(error: unknown): string {
    if (error instanceof Error && error.name === 'AbortError') {
      return 'Startsignal konnte nicht gesendet werden: Wake-on-LAN-Relay hat nicht rechtzeitig geantwortet';
    }

    if (error instanceof Error && error.message.length > 0) {
      return `Startsignal konnte nicht gesendet werden: ${error.message}`;
    }

    return 'Startsignal konnte nicht gesendet werden';
  }

  private getWakeRelayResponseMessage(
    response: Response,
    relayResponse: WakeRelayResponseBody,
  ): string {
    return (
      relayResponse.error?.message ??
      relayResponse.message ??
      `Wake-on-LAN-Relay antwortete mit Status ${response.status}`
    );
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
