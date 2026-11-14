/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {BrowserRouter} from 'react-router-dom';
import {EnvConfigurationScreen} from '@/app/EnvConfigurationScreen';
import {AppProviders, ThemeProvider} from '@/app/providers';
import {AppRouter} from '@/app/router';
import {envValidationError} from '@/lib/env';

export default function App() {
  if (envValidationError) {
    return (
      <ThemeProvider>
        <EnvConfigurationScreen error={envValidationError} />
      </ThemeProvider>
    );
  }

  return (
    <AppProviders>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
}
