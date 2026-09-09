import { registerRootComponent } from 'expo';
import { configureRtl } from './src/i18n/rtl';
import App from './src/app/App';

// Pin the app-wide layout direction before the root component renders so the
// native engine matches the Web preview on every platform. Single source of
// truth for RTL: src/i18n/rtl.ts (I18nManager).
configureRtl();

registerRootComponent(App);
