import { useCallback, useState } from 'react';

import { defaultServiceTiles } from '../services/serviceTestData';
import { serviceIconNames, type ServiceIconName, type ServiceItem } from '../types/Service';

export type ServiceTileInput = {
  href: string;
  icon: ServiceIconName;
  name: string;
};

type ServiceTilesStorage = {
  services: ServiceItem[];
  version: 1;
};

const SERVICE_TILES_STORAGE_KEY = 'dashboard.serviceTiles.v1';
const serviceIconNameSet = new Set<ServiceIconName>(serviceIconNames);

const cloneDefaultServiceTiles = (): ServiceItem[] =>
  defaultServiceTiles.map((service) => ({ ...service }));

const createServiceId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `service-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isServiceIconName = (value: unknown): value is ServiceIconName =>
  typeof value === 'string' && serviceIconNameSet.has(value as ServiceIconName);

const isServiceItem = (value: unknown): value is ServiceItem => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.href === 'string' &&
    typeof value.name === 'string' &&
    isServiceIconName(value.icon)
  );
};

const readStoredServiceTiles = (): ServiceItem[] => {
  if (typeof window === 'undefined') {
    return cloneDefaultServiceTiles();
  }

  try {
    const storedValue = window.localStorage.getItem(SERVICE_TILES_STORAGE_KEY);

    if (storedValue === null) {
      return cloneDefaultServiceTiles();
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!isRecord(parsedValue) || parsedValue.version !== 1 || !Array.isArray(parsedValue.services)) {
      return cloneDefaultServiceTiles();
    }

    return parsedValue.services.filter(isServiceItem);
  } catch {
    return cloneDefaultServiceTiles();
  }
};

const writeStoredServiceTiles = (services: ServiceItem[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const storageValue: ServiceTilesStorage = {
    services,
    version: 1,
  };

  try {
    window.localStorage.setItem(SERVICE_TILES_STORAGE_KEY, JSON.stringify(storageValue));
  } catch {
    // The in-memory state still updates when storage is unavailable.
  }
};

export function useServiceTiles() {
  const [services, setServices] = useState<ServiceItem[]>(readStoredServiceTiles);

  const updateServices = useCallback((createNextServices: (current: ServiceItem[]) => ServiceItem[]) => {
    setServices((currentServices) => {
      const nextServices = createNextServices(currentServices);

      writeStoredServiceTiles(nextServices);

      return nextServices;
    });
  }, []);

  const addService = useCallback(
    (service: ServiceTileInput) => {
      updateServices((currentServices) => [
        ...currentServices,
        {
          ...service,
          id: createServiceId(),
        },
      ]);
    },
    [updateServices],
  );

  const deleteService = useCallback(
    (serviceId: string) => {
      updateServices((currentServices) =>
        currentServices.filter((service) => service.id !== serviceId),
      );
    },
    [updateServices],
  );

  const updateService = useCallback(
    (serviceId: string, service: ServiceTileInput) => {
      updateServices((currentServices) =>
        currentServices.map((currentService) =>
          currentService.id === serviceId
            ? {
                ...currentService,
                ...service,
              }
            : currentService,
        ),
      );
    },
    [updateServices],
  );

  return {
    addService,
    deleteService,
    services,
    updateService,
  };
}
