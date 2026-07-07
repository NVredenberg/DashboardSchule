import type { StartServerResponse } from '../types/StartServerResponse.js';
import type { ServerResponse } from '../types/ServerResponse.js';
import type { ConfigService } from './ConfigService.js';
import type { ServerReachabilityService } from './ServerReachabilityService.js';
import type { WakeOnLanService } from './WakeOnLanService.js';

export class ServerService {
  public constructor(
    private readonly configService: ConfigService,
    private readonly serverReachabilityService: ServerReachabilityService,
    private readonly wakeOnLanService: WakeOnLanService,
  ) {}

  public async getServer(): Promise<ServerResponse> {
    const serverConfig = this.configService.getServerConfig();

    return {
      name: serverConfig.serverName,
      online: await this.serverReachabilityService.isOnline(serverConfig),
    };
  }

  public async startServer(): Promise<StartServerResponse> {
    const serverConfig = this.configService.getServerConfig();

    return this.wakeOnLanService.sendMagicPacket(serverConfig);
  }
}
