import type { ReactElement } from 'react';
import { useState } from 'react';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SecurityIcon from '@mui/icons-material/Security';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StorageIcon from '@mui/icons-material/Storage';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { ActionButtons } from '../components/ActionButtons';
import { ServiceCard } from '../components/ServiceCard';
import { ServiceTileDialog, type ServiceTileFormValue } from '../components/ServiceTileDialog';
import { StatusCard } from '../components/StatusCard';
import { appConfig } from '../config/appConfig';
import { useServiceTiles } from '../hooks/useServiceTiles';
import { useServerStatus } from '../hooks/useServerStatus';
import { dashboardText } from '../i18n/dashboardText';
import { dashboardLayoutTokens } from '../theme/designTokens';
import type { ServiceIconName, ServiceItem } from '../types/Service';

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

const ServicesHeader = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  flexDirection: 'row',
  gap: theme.spacing(2),
  justifyContent: 'space-between',

  [theme.breakpoints.down('sm')]: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
}));

const EmptyServices = styled(Typography)(({ theme }) => ({
  border: `${dashboardLayoutTokens.borderWidth}px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.text.secondary,
  padding: theme.spacing(3),
  textAlign: 'center',
}));

const emptyServiceTile: ServiceTileFormValue = {
  href: '',
  icon: 'ai',
  name: '',
};

const createServiceTileFormValue = (service: ServiceItem | null): ServiceTileFormValue =>
  service === null
    ? emptyServiceTile
    : {
        href: service.href,
        icon: service.icon,
        name: service.name,
      };

export function DashboardPage() {
  const {
    addService,
    deleteService,
    error: serviceTilesError,
    isLoading: areServiceTilesLoading,
    services,
    updateService,
  } = useServiceTiles();
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
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
  const isServiceDialogOpen = dialogMode !== null;

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

  const openAddServiceDialog = () => {
    setSelectedService(null);
    setDialogMode('add');
  };

  const openEditServiceDialog = (service: ServiceItem) => {
    setSelectedService(service);
    setDialogMode('edit');
  };

  const closeServiceDialog = () => {
    setDialogMode(null);
    setSelectedService(null);
  };

  const saveServiceTile = (service: ServiceTileFormValue) => {
    if (dialogMode === 'edit' && selectedService !== null) {
      updateService(selectedService.id, service);
    } else {
      addService(service);
    }

    closeServiceDialog();
  };

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
          <ServicesHeader>
            <Typography component="h2" variant="h4">
              {dashboardText.services.title}
            </Typography>
            <Button
              disabled={areServiceTilesLoading}
              onClick={openAddServiceDialog}
              startIcon={<AddIcon />}
              variant="outlined"
            >
              {dashboardText.services.add}
            </Button>
          </ServicesHeader>
          {serviceTilesError !== null ? (
            <Alert severity="error">{serviceTilesError}</Alert>
          ) : null}
          {areServiceTilesLoading ? (
            <EmptyServices>{dashboardText.services.loading}</EmptyServices>
          ) : services.length > 0 ? (
            <ServicesGrid>
              {services.map((service) => (
                <ServiceCard
                  href={service.href}
                  icon={serviceIcons[service.icon]}
                  key={service.id}
                  name={service.name}
                  onDelete={() => deleteService(service.id)}
                  onEdit={() => openEditServiceDialog(service)}
                />
              ))}
            </ServicesGrid>
          ) : (
            <EmptyServices>{dashboardText.services.empty}</EmptyServices>
          )}
        </ServicesSection>
      </DashboardStack>

      <ServiceTileDialog
        initialValue={createServiceTileFormValue(selectedService)}
        isEditing={dialogMode === 'edit'}
        onClose={closeServiceDialog}
        onSubmit={saveServiceTile}
        open={isServiceDialogOpen}
      />

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
