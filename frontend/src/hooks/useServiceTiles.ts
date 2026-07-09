import { useCallback, useEffect, useRef, useState } from 'react';

import { appConfig } from '../config/appConfig';
import { dashboardText } from '../i18n/dashboardText';
import { getServiceTiles, saveServiceTiles } from '../services/api';
import { serviceIconNames, type ServiceIconName, type ServiceItem } from '../types/Service';

export type ServiceTileInput = {
  href: string;
  icon: ServiceIconName;
  name: string;
};

const SERVICE_TILES_STORAGE_KEY = 'dashboard.serviceTiles.v1';
const legacyDefaultServiceTileIds = new Set([
  'open-web-ui',
  'comfy-ui',
  'n8n',
  'portainer',
  'pi-hole',
]);
const serviceIconNameSet = new Set<ServiceIconName>(serviceIconNames);

const createServiceId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `service-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : dashboardText.feedback.apiRequestFailed;

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

const readLegacyServiceTiles = (): ServiceItem[] | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(SERVICE_TILES_STORAGE_KEY);

    if (storedValue === null) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!isRecord(parsedValue) || parsedValue.version !== 1 || !Array.isArray(parsedValue.services)) {
      return null;
    }

    const seenServiceIds = new Set<string>();

    return parsedValue.services.flatMap((service) => {
      if (
        !isServiceItem(service) ||
        legacyDefaultServiceTileIds.has(service.id) ||
        seenServiceIds.has(service.id)
      ) {
        return [];
      }

      seenServiceIds.add(service.id);

      return [service];
    });
  } catch {
    return null;
  }
};

const removeLegacyServiceTiles = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(SERVICE_TILES_STORAGE_KEY);
  } catch {
    // Local storage can be disabled. The server state is still authoritative.
  }
};

const createServiceKey = (service: ServiceItem): string => `${service.name}\n${service.href}`;

const mergeServiceTiles = (
  currentServices: ServiceItem[],
  legacyServices: ServiceItem[],
): ServiceItem[] => {
  const seenServiceIds = new Set(currentServices.map((service) => service.id));
  const seenServiceKeys = new Set(currentServices.map(createServiceKey));
  const mergedServices = [...currentServices];

  for (const legacyService of legacyServices) {
    const legacyServiceKey = createServiceKey(legacyService);

    if (seenServiceIds.has(legacyService.id) || seenServiceKeys.has(legacyServiceKey)) {
      continue;
    }

    seenServiceIds.add(legacyService.id);
    seenServiceKeys.add(legacyServiceKey);
    mergedServices.push(legacyService);
  }

  return mergedServices;
};

export function useServiceTiles() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasMigratedLegacyTiles = useRef(false);
  const pendingSaveCount = useRef(0);
  const saveQueue = useRef(Promise.resolve());
  const servicesRef = useRef<ServiceItem[]>([]);

  const setCurrentServices = useCallback((nextServices: ServiceItem[]) => {
    servicesRef.current = nextServices;
    setServices(nextServices);
  }, []);

  const loadServices = useCallback(
    async ({ allowMigration = false, silent = false } = {}) => {
      if (silent && pendingSaveCount.current > 0) {
        return;
      }

      if (!silent) {
        setIsLoading(true);
      }

      try {
        const response = await getServiceTiles();
        let nextServices = response.services;

        if (allowMigration && !hasMigratedLegacyTiles.current) {
          hasMigratedLegacyTiles.current = true;

          const legacyServices = readLegacyServiceTiles();

          if (legacyServices !== null && legacyServices.length > 0) {
            const mergedServices = mergeServiceTiles(nextServices, legacyServices);

            if (mergedServices.length !== nextServices.length) {
              nextServices = (await saveServiceTiles(mergedServices)).services;
            }
          }

          removeLegacyServiceTiles();
        }

        setCurrentServices(nextServices);
        setError(null);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [setCurrentServices],
  );

  useEffect(() => {
    void loadServices({ allowMigration: true });
  }, [loadServices]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadServices({ silent: true });
    }, appConfig.pollingIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadServices]);

  const updateServices = useCallback(
    (createNextServices: (current: ServiceItem[]) => ServiceItem[]) => {
      const previousServices = servicesRef.current;
      const nextServices = createNextServices(previousServices);

      pendingSaveCount.current += 1;
      setCurrentServices(nextServices);
      setError(null);

      const pendingSave = saveQueue.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const response = await saveServiceTiles(nextServices);

            if (servicesRef.current === nextServices) {
              setCurrentServices(response.services);
            }

            removeLegacyServiceTiles();
            setError(null);
          } catch (saveError) {
            if (servicesRef.current === nextServices) {
              setCurrentServices(previousServices);
            }

            setError(getErrorMessage(saveError));

            throw saveError;
          } finally {
            pendingSaveCount.current -= 1;
          }
        });

      saveQueue.current = pendingSave;

      void pendingSave.catch(() => undefined);
    },
    [setCurrentServices],
  );

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
    error,
    isLoading,
    services,
    updateService,
  };
}
