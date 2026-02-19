import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";

export const viewport: Viewport = {
  // Fills the notch / dynamic-island area on iPhone
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // Prevents iOS from zooming in when a form input is focused
  maximumScale: 1,
  // Colours the browser chrome / status bar to match the app
  themeColor: "#2563EB",
};

export const metadata: Metadata = {
  title: "RoyalFitness - Gym, Nutrition & Wellness",
  description: "Track workouts, meals, and wellness. Connect with friends.",
  // --- PWA / Add to Home Screen ---
  appleWebApp: {
    // Removes Safari's browser chrome when launched from home screen on iOS
    capable: true,
    // "default" keeps the status bar visible with a light background;
    // use "black-translucent" for an immersive full-bleed look
    statusBarStyle: "default",
    title: "RoyalFitness",
  },
  // Prevents iOS from auto-linking phone numbers as tappable links
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} antialiased bg-background`}>
        <Providers>
          {children}
          <Toaster position="bottom-center" />
        </Providers>
      </body>
    </html>
  );
}
