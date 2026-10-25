import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sg16global.aiengine',
  appName: 'SG16 AI Engine',
  webDir: 'dist',
  server: {
    url: 'https://sg16engine.com',
    cleartext: false,
    allowNavigation: ['sg16engine.com', 'www.sg16engine.com'],
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#050507',
  },
};

export default config;
