import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sg16global.aiengine',
  appName: 'SG16 AI Engine',
  webDir: '../backend/public',
  server: {
    url: 'https://sg16engine.com',
    cleartext: false,
    allowNavigation: [
      'sg16engine.com',
      'www.sg16engine.com',
      'accounts.google.com',
      'oauth2.googleapis.com',
    ],
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#050507',
  },
};

export default config;
