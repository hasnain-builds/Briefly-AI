import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brieflyai.app',
  appName: 'Briefly AI',
  webDir: 'public',
  server: {
    url: 'https://briefly-ai-iota.vercel.app',
    cleartext: false,
  },
};

export default config;