declare module 'wake_on_lan' {
  type WakeCallback = (error?: Error) => void;

  type WakeOptions = {
    address?: string;
    interval?: number;
    num_packets?: number;
    port?: number;
  };

  type WakeOnLan = {
    wake(macAddress: string, callback: WakeCallback): void;
    wake(macAddress: string, options: WakeOptions, callback: WakeCallback): void;
  };

  const wakeOnLan: WakeOnLan;

  export default wakeOnLan;
}
