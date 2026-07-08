import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { ConfigService } from './services/ConfigService.js';
import { WakeOnLanService } from './services/WakeOnLanService.js';
import type { ServerConfig } from './types/ServerConfig.js';
import { AppError } from './utils/AppError.js';
import { logger } from './utils/logger.js';

dotenv.config();

const DEFAULT_RELAY_HOST = '127.0.0.1';
const DEFAULT_RELAY_PORT = 3011;
const DEFAULT_WAKE_PORT = 9;

type RelayRequestBody = {
  broadcastAddress?: string;
  mac?: string;
  serverIp?: string;
  serverName?: string;
  wakePort?: number;
};

const getRelayHost = (): string => {
  const relayHost = process.env.WOL_RELAY_HOST?.trim() || DEFAULT_RELAY_HOST;

  return relayHost;
};

const getRelayPort = (): number => {
  const relayPort = Number(process.env.WOL_RELAY_PORT ?? DEFAULT_RELAY_PORT);

  if (!Number.isInteger(relayPort) || relayPort <= 0 || relayPort > 65535) {
    throw new AppError('Invalid WOL_RELAY_PORT configuration', 500);
  }

  return relayPort;
};

const normalizeMacAddress = (macAddress: string): string =>
  macAddress.trim().toLowerCase().replaceAll('-', ':');

const getBroadcastAddress = (serverConfig: ServerConfig): string =>
  serverConfig.broadcastAddress ??
  getDefaultIpv4BroadcastAddress(serverConfig.ip) ??
  '255.255.255.255';

const getDefaultIpv4BroadcastAddress = (ipAddress: string): string | undefined => {
  const octets = ipAddress.split('.');

  if (octets.length !== 4 || !octets.every((octet) => /^\d{1,3}$/.test(octet))) {
    return undefined;
  }

  return `${octets[0]}.${octets[1]}.${octets[2]}.255`;
};

const createRelayRequestError = (message: string): AppError =>
  new AppError(message, 400, undefined, {
    success: false,
    message,
  });

const readOptionalString = (
  relayRequestBody: Record<string, unknown>,
  fieldName: keyof RelayRequestBody,
): string | undefined => {
  const value = relayRequestBody[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw createRelayRequestError(`Relay-Anfrage enthaelt ein ungueltiges Feld: ${fieldName}`);
  }

  return value;
};

const readOptionalNumber = (
  relayRequestBody: Record<string, unknown>,
  fieldName: keyof RelayRequestBody,
): number | undefined => {
  const value = relayRequestBody[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw createRelayRequestError(`Relay-Anfrage enthaelt ein ungueltiges Feld: ${fieldName}`);
  }

  return value;
};

const readRelayRequestBody = (requestBody: unknown): RelayRequestBody => {
  if (requestBody === undefined || requestBody === null) {
    return {};
  }

  if (typeof requestBody !== 'object' || Array.isArray(requestBody)) {
    throw createRelayRequestError('Relay-Anfrage enthaelt keinen gueltigen JSON-Body');
  }

  const relayRequestBody = requestBody as Record<string, unknown>;

  return {
    broadcastAddress: readOptionalString(relayRequestBody, 'broadcastAddress'),
    mac: readOptionalString(relayRequestBody, 'mac'),
    serverIp: readOptionalString(relayRequestBody, 'serverIp'),
    serverName: readOptionalString(relayRequestBody, 'serverName'),
    wakePort: readOptionalNumber(relayRequestBody, 'wakePort'),
  };
};

const assertRelayRequestMatchesConfig = (
  relayRequest: RelayRequestBody,
  serverConfig: ServerConfig,
): void => {
  if (
    relayRequest.mac !== undefined &&
    normalizeMacAddress(relayRequest.mac) !== normalizeMacAddress(serverConfig.mac)
  ) {
    throw createRelayRequestError('Relay-Anfrage passt nicht zur konfigurierten MAC-Adresse');
  }

  if (relayRequest.serverIp !== undefined && relayRequest.serverIp !== serverConfig.ip) {
    throw createRelayRequestError('Relay-Anfrage passt nicht zur konfigurierten Server-IP');
  }

  if (
    relayRequest.serverName !== undefined &&
    relayRequest.serverName !== serverConfig.serverName
  ) {
    throw createRelayRequestError('Relay-Anfrage passt nicht zum konfigurierten Servernamen');
  }

  if (
    relayRequest.broadcastAddress !== undefined &&
    relayRequest.broadcastAddress !== getBroadcastAddress(serverConfig)
  ) {
    throw createRelayRequestError('Relay-Anfrage passt nicht zur konfigurierten Broadcast-Adresse');
  }

  if (
    relayRequest.wakePort !== undefined &&
    relayRequest.wakePort !== (serverConfig.wakePort ?? DEFAULT_WAKE_PORT)
  ) {
    throw createRelayRequestError('Relay-Anfrage passt nicht zum konfigurierten Wake-on-LAN-Port');
  }
};

try {
  const configService = new ConfigService();
  const wakeOnLanService = new WakeOnLanService();
  const serverConfig = configService.getServerConfig();
  const relayHost = getRelayHost();
  const relayPort = getRelayPort();
  const app = express();

  app.use(requestLogger);
  app.use(express.json());

  app.get('/health', (_request: Request, response: Response) => {
    response.status(200).json({
      serverName: serverConfig.serverName,
      status: 'ok',
    });
  });

  app.post('/wake', async (request: Request, response: Response, next: NextFunction) => {
    try {
      assertRelayRequestMatchesConfig(readRelayRequestBody(request.body), serverConfig);

      response.status(200).json(await wakeOnLanService.sendMagicPacketDirect(serverConfig));
    } catch (error) {
      next(error);
    }
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = app.listen(relayPort, relayHost, () => {
    logger.info('Wake-on-LAN relay listening', {
      relayHost,
      relayPort,
      serverName: serverConfig.serverName,
      serverIp: serverConfig.ip,
    });
  });

  server.on('error', (error) => {
    logger.error('Wake-on-LAN relay failed to start', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
} catch (error) {
  logger.error('Wake-on-LAN relay configuration failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}
