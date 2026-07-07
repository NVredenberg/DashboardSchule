import { createTheme } from '@mui/material/styles';

import { dashboardColorTokens, dashboardLayoutTokens } from './designTokens';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: dashboardColorTokens.background,
      paper: dashboardColorTokens.surface,
    },
    divider: dashboardColorTokens.border,
    error: {
      contrastText: dashboardColorTokens.errorContrast,
      dark: dashboardColorTokens.error,
      main: dashboardColorTokens.error,
    },
    primary: {
      light: dashboardColorTokens.primaryLight,
      main: dashboardColorTokens.primary,
    },
    success: {
      contrastText: dashboardColorTokens.successContrast,
      dark: dashboardColorTokens.success,
      main: dashboardColorTokens.success,
    },
    text: {
      disabled: dashboardColorTokens.textDisabled,
      primary: dashboardColorTokens.textPrimary,
      secondary: dashboardColorTokens.textSecondary,
    },
  },
  shape: {
    borderRadius: dashboardLayoutTokens.borderRadius,
  },
  typography: {
    fontFamily: dashboardLayoutTokens.fontFamily,
    h2: {
      fontSize: dashboardLayoutTokens.serverNameFontSize,
      fontWeight: dashboardLayoutTokens.serverNameFontWeight,
      letterSpacing: 0,
      lineHeight: dashboardLayoutTokens.headingLineHeight,
    },
    h4: {
      fontSize: dashboardLayoutTokens.sectionTitleFontSize,
      fontWeight: dashboardLayoutTokens.sectionTitleFontWeight,
      letterSpacing: 0,
      lineHeight: dashboardLayoutTokens.headingLineHeight,
    },
    h6: {
      fontSize: dashboardLayoutTokens.serviceTitleFontSize,
      fontWeight: dashboardLayoutTokens.serviceTitleFontWeight,
      letterSpacing: 0,
      lineHeight: dashboardLayoutTokens.bodyLineHeight,
    },
    overline: {
      color: dashboardColorTokens.textSecondary,
      fontSize: dashboardLayoutTokens.dashboardTitleFontSize,
      fontWeight: dashboardLayoutTokens.dashboardTitleFontWeight,
      letterSpacing: 0,
      lineHeight: dashboardLayoutTokens.bodyLineHeight,
      textTransform: 'uppercase',
    },
  },
});
