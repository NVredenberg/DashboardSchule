export type ServerConfig = {
  broadcastAddress?: string;
  onlineCheckTimeoutMs?: number;
  serverName: string;
  ip: string;
  mac: string;
  refreshInterval: number;
  wakeCommand?: string;
  wakePort?: number;
};
