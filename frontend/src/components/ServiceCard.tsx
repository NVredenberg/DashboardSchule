import type { ReactNode } from 'react';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { dashboardText } from '../i18n/dashboardText';
import { dashboardLayoutTokens } from '../theme/designTokens';

type ServiceCardProps = {
  href: string;
  icon: ReactNode;
  name: string;
  onDelete: () => void;
  onEdit: () => void;
};

const ServiceCardRoot = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `${dashboardLayoutTokens.borderWidth}px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[dashboardLayoutTokens.cardShadowLevel],
  height: '100%',
}));

const ServiceCardContent = styled(CardContent)(({ theme }) => ({
  '&:last-child': {
    paddingBottom: theme.spacing(dashboardLayoutTokens.serviceCardPadding),
  },
  minHeight: dashboardLayoutTokens.serviceCardMinHeight,
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
  minWidth: 0,
}));

const ServiceInfo = styled(Stack)({
  flex: 1,
  minWidth: 0,
});

const ServiceHref = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  overflowWrap: 'anywhere',
}));

const ServiceActions = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  flexShrink: 0,
  gap: theme.spacing(0.5),
}));

export function ServiceCard({ href, icon, name, onDelete, onEdit }: ServiceCardProps) {
  return (
    <ServiceCardRoot variant="outlined">
      <ServiceCardContent>
        <ServiceCardBody>
          <ServiceIconFrame>{icon}</ServiceIconFrame>
          <ServiceInfo>
            <Typography component="h3" variant="h6">
              {name}
            </Typography>
            <ServiceHref variant="body2">{href}</ServiceHref>
          </ServiceInfo>
          <ServiceActions>
            <Tooltip title={dashboardText.services.open}>
              <IconButton
                aria-label={`${dashboardText.services.open}: ${name}`}
                component="a"
                href={href}
                rel="noreferrer"
                target="_blank"
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={dashboardText.services.edit}>
              <IconButton aria-label={`${dashboardText.services.edit}: ${name}`} onClick={onEdit}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={dashboardText.services.delete}>
              <IconButton
                aria-label={`${dashboardText.services.delete}: ${name}`}
                color="error"
                onClick={onDelete}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Tooltip>
          </ServiceActions>
        </ServiceCardBody>
      </ServiceCardContent>
    </ServiceCardRoot>
  );
}
