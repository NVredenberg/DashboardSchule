import { useCallback, useEffect, useRef, useState } from 'react';

import { appConfig } from '../config/appConfig';
import { dashboardText } from '../i18n/dashboardText';
import { getServerStatus, startServer } from '../services/api';
import type { ServerActionName, ServerNotification, ServerStatus } from '../types/Server';

type LoadOptions = {
  silent?: boolean;
};

type UseServerStatusResult = {
  actionInProgress: ServerActionName | null;
  canStart: boolean;
  clearNotification: () => void;
  errorMessage: string | null;
  isInitialLoading: boolean;
  isOnline: boolean;
  isRefreshing: boolean;
  notification: ServerNotification | null;
  serverName: string | null;
  start: () => Promise<void>;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return dashboardText.feedback.unexpectedError;
};

export function useServerStatus(): UseServerStatusResult {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<ServerActionName | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<ServerNotification | null>(null);
  const notificationIdRef = useRef(0);

  const showNotification = useCallback(
    (severity: ServerNotification['severity'], message: string) => {
      notificationIdRef.current += 1;
      setNotification({
        id: notificationIdRef.current,
        message,
        severity,
      });
    },
    [],
  );

  const loadServerStatus = useCallback(
    async ({ silent = false }: LoadOptions = {}) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }

      try {
        const nextServerStatus = await getServerStatus();
        setServerStatus(nextServerStatus);
        setErrorMessage(null);
      } catch (error) {
        const message = getErrorMessage(error);
        setErrorMessage(message);
        showNotification('error', message);
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsInitialLoading(false);
        }
      }
    },
    [showNotification],
  );

  const runServerAction = useCallback(
    async (
      actionName: ServerActionName,
      action: () => Promise<{ message: string; success: boolean }>,
    ) => {
      setActionInProgress(actionName);

      try {
        const result = await action();

        if (result.success) {
          showNotification('success', result.message);
          await loadServerStatus({ silent: true });
          return;
        }

        setErrorMessage(result.message);
        showNotification('error', result.message);
      } catch (error) {
        const message = getErrorMessage(error);
        setErrorMessage(message);
        showNotification('error', message);
      } finally {
        setActionInProgress(null);
      }
    },
    [loadServerStatus, showNotification],
  );

  useEffect(() => {
    void loadServerStatus();

    const pollingId = window.setInterval(() => {
      void loadServerStatus({ silent: true });
    }, appConfig.pollingIntervalMs);

    return () => {
      window.clearInterval(pollingId);
    };
  }, [loadServerStatus]);

  const isOnline = serverStatus?.online ?? false;
  const hasServerStatus = serverStatus !== null;
  const isActionBlocked = actionInProgress !== null || isInitialLoading || !hasServerStatus;

  return {
    actionInProgress,
    canStart: hasServerStatus && !isOnline && !isActionBlocked,
    clearNotification: () => setNotification(null),
    errorMessage,
    isInitialLoading,
    isOnline,
    isRefreshing,
    notification,
    serverName: serverStatus?.name ?? null,
    start: () => runServerAction('start', startServer),
  };
}
