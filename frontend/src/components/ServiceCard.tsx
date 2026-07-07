import type { ReactNode } from 'react';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { dashboardLayoutTokens } from '../theme/designTokens';

type ServiceCardProps = {
  href: string;
  icon: ReactNode;
  name: string;
};

const ServiceCardRoot = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `${dashboardLayoutTokens.borderWidth}px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[dashboardLayoutTokens.cardShadowLevel],
  height: '100%',
}));

const ServiceLink = styled('a')(({ theme }) => ({
  color: 'inherit',
  display: 'block',
  height: '100%',
  minHeight: dashboardLayoutTokens.serviceCardMinHeight,
  textDecoration: 'none',

  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },

  '&:focus-visible': {
    outline: `${dashboardLayoutTokens.focusOutlineWidth}px solid ${theme.palette.primary.main}`,
    outlineOffset: dashboardLayoutTokens.focusOutlineOffset,
  },
}));

const ServiceCardContent = styled(CardContent)(({ theme }) => ({
  '&:last-child': {
    paddingBottom: theme.spacing(dashboardLayoutTokens.serviceCardPadding),
  },
  padding: theme.spacing(dashboardLayoutTokens.serviceCardPadding),
}));

const ServiceIconFrame = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  backgroundColor: theme.palette.action.hover,
  border: `${dashboardLayoutTokens.borderWidth}px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.primary.main,
  height: dashboardLayoutTokens.serviceIconFrameSize,
  justifyContent: 'center',
  width: dashboardLayoutTokens.serviceIconFrameSize,

  '& svg': {
    fontSize: dashboardLayoutTokens.serviceIconSize,
  },
}));

const ServiceCardBody = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  flexDirection: 'row',
  gap: theme.spacing(dashboardLayoutTokens.serviceCardGap),
}));

export function ServiceCard({ href, icon, name }: ServiceCardProps) {
  return (
    <ServiceCardRoot variant="outlined">
      <ServiceLink href={href} rel="noreferrer" target="_blank">
        <ServiceCardContent>
          <ServiceCardBody>
            <ServiceIconFrame>{icon}</ServiceIconFrame>
            <Typography component="h3" variant="h6">
              {name}
            </Typography>
          </ServiceCardBody>
        </ServiceCardContent>
      </ServiceLink>
    </ServiceCardRoot>
  );
}
