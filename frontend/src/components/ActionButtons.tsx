import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';

import { dashboardLayoutTokens } from '../theme/designTokens';

type ActionButtonItem = {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
};

type ActionButtonsProps = {
  ariaLabel: string;
  actions: readonly ActionButtonItem[];
};

const ActionsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(dashboardLayoutTokens.actionButtonGap),
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${dashboardLayoutTokens.actionButtonMinWidth}px), 1fr))`,
  width: '100%',
}));

const DashboardActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  fontSize: theme.typography.pxToRem(dashboardLayoutTokens.actionButtonFontSize),
  fontWeight: theme.typography.fontWeightBold,
  letterSpacing: 0,
  minHeight: dashboardLayoutTokens.actionButtonMinHeight,
  textTransform: 'uppercase',

  '&.Mui-disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    borderColor: theme.palette.divider,
    color: theme.palette.text.disabled,
  },

  '& .MuiCircularProgress-root': {
    color: 'currentColor',
  },
}));

export function ActionButtons({ actions, ariaLabel }: ActionButtonsProps) {
  return (
    <ActionsGrid aria-label={ariaLabel}>
      {actions.map((action) => (
        <DashboardActionButton
          aria-busy={action.loading}
          disabled={action.disabled}
          fullWidth
          key={action.label}
          onClick={action.onClick}
          size="large"
          startIcon={
            action.loading ? (
              <CircularProgress size={dashboardLayoutTokens.actionButtonProgressSize} />
            ) : (
              action.icon
            )
          }
          variant="contained"
        >
          {action.label}
        </DashboardActionButton>
      ))}
    </ActionsGrid>
  );
}
