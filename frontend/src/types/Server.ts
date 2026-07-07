export type ServerStatus = {
  name: string;
  online: boolean;
};

export type ServerActionResponse = {
  message: string;
  success: boolean;
};

export type ServerActionName = 'start';

export type ServerNotification = {
  id: number;
  message: string;
  severity: 'error' | 'success';
};
