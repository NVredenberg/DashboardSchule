import type { ReactElement } from 'react';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SecurityIcon from '@mui/icons-material/Security';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StorageIcon from '@mui/icons-material/Storage';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { ActionButtons } from '../components/ActionButtons';
import { ServiceCard } from '../components/ServiceCard';
import { StatusCard } from '../components/StatusCard';
import { appConfig } from '../config/appConfig';
import { useServerStatus } from '../hooks/useServerStatus';
import { dashboardText } from '../i18n/dashboardText';
import { serviceTestData } from '../services/serviceTestData';
import { dashboardLayoutTokens } from '../theme/designTokens';
import type { ServiceIconName } from '../types/Service';

const serviceIcons: Record<ServiceIconName, ReactElement> = {
  automation: <AccountTreeIcon />,
  container: <StorageIcon />,
  creative: <AutoAwesomeIcon />,
  dns: <SecurityIcon />,
  ai: <SmartToyIcon />,
};

const DashboardStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(dashboardLayoutTokens.sectionGap),
  width: '100%',
}));

const ServicesGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(dashboardLayoutTokens.serviceGridGap),
  gridTemplateColumns: `repeat(${dashboardLayoutTokens.serviceGridColumnsDesktop}, minmax(0, 1fr))`,

  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: `repeat(${dashboardLayoutTokens.serviceGridColumnsTablet}, minmax(0, 1fr))`,
  },

  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
  },
}));

const ServicesSection = styled('section')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(dashboardLayoutTokens.serviceSectionGap),
}));

export function DashboardPage() {
  const {
    actionInProgress,
    canStart,
    clearNotification,
    isInitialLoading,
    isOnline,
    isRefreshing,
    notification,
    serverName,
    start,
  } = useServerStatus();

  const actionItems = [
    {
      disabled: !canStart,
      icon: <PowerSettingsNewIcon />,
      label:
        actionInProgress === 'start'
          ? dashboardText.actions.starting
          : isOnline
            ? dashboardText.actions.alreadyRunning
            : dashboardText.actions.start,
      loading: actionInProgress === 'start',
      onClick: start,
    },
  ] as const;

  return (
    <>
      <DashboardStack>
        <StatusCard
          isLoading={isInitialLoading}
          isOnline={isOnline}
          isRefreshing={isRefreshing}
          loadingLabel={dashboardText.server.loading}
          logoAlt={dashboardText.logo.alt}
          logoSrc={dashboardText.logo.src}
          offlineLabel={dashboardText.server.statusOffline}
          onlineLabel={dashboardText.server.statusOnline}
          serverName={serverName ?? dashboardText.server.name}
          title={dashboardText.title}
        />

        <ActionButtons actions={actionItems} ariaLabel={dashboardText.actions.ariaLabel} />

        <ServicesSection>
          <Typography component="h2" variant="h4">
            {dashboardText.services.title}
          </Typography>
          <ServicesGrid>
            {serviceTestData.map((service) => (
              <ServiceCard
                href={service.href}
                icon={serviceIcons[service.icon]}
                key={service.id}
                name={service.name}
              />
            ))}
          </ServicesGrid>
        </ServicesSection>
      </DashboardStack>

      <Snackbar
        autoHideDuration={appConfig.snackbarAutoHideDurationMs}
        key={notification?.id}
        onClose={clearNotification}
        open={notification !== null}
      >
        <Alert
          closeText={dashboardText.feedback.close}
          onClose={clearNotification}
          severity={notification?.severity ?? 'success'}
          variant="filled"
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
