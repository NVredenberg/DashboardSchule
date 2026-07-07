export type ServiceIconName = 'ai' | 'automation' | 'container' | 'creative' | 'dns';

export type ServiceItem = {
  href: string;
  icon: ServiceIconName;
  id: string;
  name: string;
};
