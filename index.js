import { registerRootComponent } from 'expo';

import App from './App';
import { I18nProvider } from './utils/i18n';

// Wrapper component with i18n provider
function AppWithI18n() {
  return (
    <I18nProvider>
      <App />
    </I18nProvider>
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(AppWithI18n);
