export const appConfig = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, ''),
  pollingIntervalMs: 10000,
  serviceBaseUrl: import.meta.env.VITE_SERVICE_BASE_URL?.replace(/\/$/, '') ?? null,
  snackbarAutoHideDurationMs: 5000,
} as const;
