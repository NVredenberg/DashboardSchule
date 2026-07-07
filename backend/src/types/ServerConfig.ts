export type ServerConfig = {
  broadcastAddress?: string;
  serverName: string;
  ip: string;
  mac: string;
  refreshInterval: number;
  wakePort?: number;
};
