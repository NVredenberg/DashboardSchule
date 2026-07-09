import { appConfig } from '../config/appConfig';
import { dashboardText } from '../i18n/dashboardText';
import type { ServiceItem } from '../types/Service';
import type { ServerActionResponse, ServerStatus } from '../types/Server';

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
  message?: string;
};

class ApiError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const createApiUrl = (path: string): string => `${appConfig.apiBaseUrl}${path}`;

const getErrorMessageFromBody = (body: unknown): string | null => {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const responseBody = body as ApiErrorResponse;

  return responseBody.message ?? responseBody.error?.message ?? null;
};

const requestJson = async <TResponse>(path: string, init?: RequestInit): Promise<TResponse> => {
  const response = await fetch(createApiUrl(path), {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...init,
  });

  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new ApiError(getErrorMessageFromBody(body) ?? dashboardText.feedback.apiRequestFailed);
  }

  return body as TResponse;
};

const postServerAction = async (path: string): Promise<ServerActionResponse> => {
  const response = await requestJson<ServerActionResponse>(path, {
    method: 'POST',
  });

  if (!response.success) {
    throw new ApiError(response.message);
  }

  return response;
};

export const getServerStatus = (): Promise<ServerStatus> => requestJson<ServerStatus>('/server');

export const startServer = (): Promise<ServerActionResponse> => postServerAction('/server/start');

export const getServiceTiles = (): Promise<{ services: ServiceItem[] }> =>
  requestJson<{ services: ServiceItem[] }>('/services');

export const saveServiceTiles = (services: ServiceItem[]): Promise<{ services: ServiceItem[] }> =>
  requestJson<{ services: ServiceItem[] }>('/services', {
    body: JSON.stringify({
      services,
    }),
    method: 'PUT',
  });
