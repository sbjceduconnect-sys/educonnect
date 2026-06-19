import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sbjc.educonnect',
  appName: 'EduConnect',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
