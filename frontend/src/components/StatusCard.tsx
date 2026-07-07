import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import DnsIcon from '@mui/icons-material/Dns';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { dashboardLayoutTokens } from '../theme/designTokens';

type StatusCardProps = {
  isLoading: boolean;
  isOnline: boolean;
  isRefreshing: boolean;
  loadingLabel: string;
  logoAlt: string;
  logoSrc: string;
  offlineLabel: string;
  onlineLabel: string;
  serverName: string;
  title: string;
};

const StatusCardRoot = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `${dashboardLayoutTokens.borderWidth}px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[dashboardLayoutTokens.heroShadowLevel],
  overflow: 'hidden',
}));

const StatusRefreshProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'visible',
})<{ visible: boolean }>(({ theme, visible }) => ({
  height: dashboardLayoutTokens.statusLoadingBarHeight,
  visibility: visible ? 'visible' : 'hidden',

  '& .MuiLinearProgress-bar': {
    backgroundColor: theme.palette.primary.main,
  },
}));

const StatusCardContent = styled(CardContent)(({ theme }) => ({
  '&:last-child': {
    paddingBottom: theme.spacing(dashboardLayoutTokens.statusCardPaddingDesktop),
  },
  padding: theme.spacing(dashboardLayoutTokens.statusCardPaddingDesktop),

  [theme.breakpoints.down('sm')]: {
    '&:last-child': {
      paddingBottom: theme.spacing(dashboardLayoutTokens.statusCardPaddingMobile),
    },
    padding: theme.spacing(dashboardLayoutTokens.statusCardPaddingMobile),
  },
}));

const BrandLogo = styled('img')({
  display: 'block',
  height: dashboardLayoutTokens.logoHeight,
  maxWidth: '100%',
  objectFit: 'contain',
});

const ServerIconFrame = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  backgroundColor: theme.palette.action.hover,
  border: `${dashboardLayoutTokens.borderWidth}px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.primary.main,
  flexShrink: 0,
  height: dashboardLayoutTokens.statusIconFrameSize,
  justifyContent: 'center',
  width: dashboardLayoutTokens.statusIconFrameSize,

  '& svg': {
    fontSize: dashboardLayoutTokens.statusIconSize,
  },
}));

const StatusHeader = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  flexDirection: 'row',
  gap: theme.spacing(dashboardLayoutTokens.statusHeaderGap),
  justifyContent: 'space-between',

  [theme.breakpoints.down('sm')]: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
}));

const StatusContent = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  flexDirection: 'row',
  gap: theme.spacing(dashboardLayoutTokens.statusContentGap),
  paddingTop: theme.spacing(dashboardLayoutTokens.statusContentTopPadding),

  [theme.breakpoints.down('sm')]: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
}));

const ServerStatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'serverStatus',
})<{ serverStatus: 'loading' | 'offline' | 'online' }>(({ serverStatus, theme }) => ({
  backgroundColor:
    serverStatus === 'online'
      ? theme.palette.success.dark
      : serverStatus === 'loading'
        ? theme.palette.action.selected
        : theme.palette.error.dark,
  color:
    serverStatus === 'online'
      ? theme.palette.success.contrastText
      : serverStatus === 'loading'
        ? theme.palette.text.primary
        : theme.palette.error.contrastText,
  fontWeight: theme.typography.fontWeightBold,
  letterSpacing: 0,

  '& .MuiCircularProgress-root': {
    color: 'currentColor',
  },
}));

export function StatusCard({
  isLoading,
  isOnline,
  isRefreshing,
  loadingLabel,
  logoAlt,
  logoSrc,
  offlineLabel,
  onlineLabel,
  serverName,
  title,
}: StatusCardProps) {
  const serverStatus = isLoading ? 'loading' : isOnline ? 'online' : 'offline';
  const statusLabel = isLoading ? loadingLabel : isOnline ? onlineLabel : offlineLabel;
  const statusIcon = isLoading ? (
    <CircularProgress size={dashboardLayoutTokens.statusChipProgressSize} />
  ) : isOnline ? (
    <CloudQueueIcon />
  ) : (
    <CloudOffIcon />
  );

  return (
    <StatusCardRoot>
      <StatusRefreshProgress
        aria-hidden={!isLoading && !isRefreshing}
        visible={isLoading || isRefreshing}
      />
      <StatusCardContent>
        <StatusHeader>
          <Typography component="h1" variant="overline">
            {title}
          </Typography>
          <BrandLogo alt={logoAlt} src={logoSrc} />
        </StatusHeader>

        <StatusContent>
          <ServerIconFrame>
            <DnsIcon />
          </ServerIconFrame>
          <Box>
            <Typography component="h2" variant="h2">
              {serverName}
            </Typography>
            <ServerStatusChip
              icon={statusIcon}
              label={statusLabel}
              serverStatus={serverStatus}
            />
          </Box>
        </StatusContent>
      </StatusCardContent>
    </StatusCardRoot>
  );
}
