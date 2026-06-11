import type { CapacitorConfig } from '@capacitor/cli';

/** Cor de fundo alinhada a `colors.background` em `src/theme/colors.ts` */
const APP_BACKGROUND = '#F5F0EA';

const config: CapacitorConfig = {
  appId: 'com.ntrsl.ai',
  appName: 'NTRSL AI',
  webDir: 'dist',
  android: {
    backgroundColor: APP_BACKGROUND,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      androidIsEncryption: false,
    },
    SplashScreen: {
      launchShowDuration: 400,
      launchAutoHide: true,
      backgroundColor: APP_BACKGROUND,
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: APP_BACKGROUND,
    },
    Keyboard: {
      /** Android: ajuda quando a status bar sobrepõe o WebView em fullscreen */
      resizeOnFullScreen: true,
    },
  },
};

export default config;
