import { appConfig } from '../config/appConfig';
import type { ServiceItem } from '../types/Service';

const defaultServiceBaseUrl = `${window.location.protocol}//${window.location.hostname}`;
const serviceBaseUrl = appConfig.serviceBaseUrl ?? defaultServiceBaseUrl;

const createServiceHref = (port: number): string => `${serviceBaseUrl}:${port}`;

export const defaultServiceTiles: readonly ServiceItem[] = [
  {
    href: createServiceHref(8080),
    icon: 'ai',
    id: 'open-web-ui',
    name: 'OpenWebUI',
  },
  {
    href: createServiceHref(8188),
    icon: 'creative',
    id: 'comfy-ui',
    name: 'ComfyUI',
  },
  {
    href: createServiceHref(5678),
    icon: 'automation',
    id: 'n8n',
    name: 'n8n',
  },
  {
    href: createServiceHref(9000),
    icon: 'container',
    id: 'portainer',
    name: 'Portainer',
  },
  {
    href: createServiceHref(8081),
    icon: 'dns',
    id: 'pi-hole',
    name: 'Pi-hole',
  },
];
