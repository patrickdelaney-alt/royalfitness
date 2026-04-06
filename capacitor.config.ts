import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.royalwellness.app',
  appName: 'Royal',
  // webDir is required by Capacitor CLI but unused when server.url is set.
  // The native app loads your live Vercel deployment instead.
  webDir: 'public',
  server: {
    // Replace with your production Vercel URL before running `npx cap add ios`
    url: 'https://royalwellness.app',
    cleartext: false,
  },
};

export default config;
