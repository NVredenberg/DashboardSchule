export const serviceIconNames = ['ai', 'automation', 'container', 'creative', 'dns'] as const;

export type ServiceIconName = (typeof serviceIconNames)[number];

export type ServiceItem = {
  href: string;
  icon: ServiceIconName;
  id: string;
  name: string;
};
