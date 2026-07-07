import type { PropsWithChildren } from 'react';

import { styled } from '@mui/material/styles';

import { dashboardColorTokens, dashboardLayoutTokens } from '../theme/designTokens';

const Main = styled('main')(({ theme }) => ({
  background: dashboardColorTokens.pageBackground,
  minHeight: '100vh',
  padding: theme.spacing(
    dashboardLayoutTokens.appVerticalPaddingDesktop,
    dashboardLayoutTokens.appPaddingDesktop,
  ),

  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(
      dashboardLayoutTokens.appVerticalPaddingTablet,
      dashboardLayoutTokens.appPaddingTablet,
    ),
  },

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(
      dashboardLayoutTokens.appVerticalPaddingMobile,
      dashboardLayoutTokens.appPaddingMobile,
    ),
  },
}));

const Content = styled('div')({
  marginInline: 'auto',
  maxWidth: dashboardLayoutTokens.appMaxWidth,
  width: '100%',
});

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <Main>
      <Content>{children}</Content>
    </Main>
  );
}
