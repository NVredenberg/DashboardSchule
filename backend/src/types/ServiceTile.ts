export const serviceIconNames = ['ai', 'automation', 'container', 'creative', 'dns'] as const;

export type ServiceIconName = (typeof serviceIconNames)[number];

export type ServiceTile = {
  href: string;
  icon: ServiceIconName;
  id: string;
  name: string;
};

export type ServiceTilesConfig = {
  services: ServiceTile[];
  version: 1;
};

export type ServiceTilesResponse = {
  services: ServiceTile[];
};
