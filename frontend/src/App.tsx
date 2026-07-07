import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { appTheme } from './theme/appTheme';

export function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppLayout>
        <DashboardPage />
      </AppLayout>
    </ThemeProvider>
  );
}
