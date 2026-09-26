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
  plugins: {
    // Native Google Sign-In (see src/lib/native-google.ts). Only Google is
    // bundled; the others stay off to keep the app small.
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
      logLevel: 1,
    },
  },
};

export default config;
