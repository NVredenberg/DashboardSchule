declare module 'wake_on_lan' {
  type WakeCallback = (error?: Error) => void;

  type WakeOnLan = {
    wake(macAddress: string, callback: WakeCallback): void;
  };

  const wakeOnLan: WakeOnLan;

  export default wakeOnLan;
}

