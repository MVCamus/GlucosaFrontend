import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marcelo.glucosa',
  appName: 'Glucosa App',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      presentationOptions: ["badge", "sound", "banner", "list"]
    }
  }
};

export default config;
