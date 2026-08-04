import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/app-shell";
import { themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  applicationName: "Hyrox Coach",
  title: {
    default: "Hyrox Coach",
    template: "%s · Hyrox Coach",
  },
  description:
    "Persönlicher Hyrox-Trainings-Coach: Training tracken, Einheiten planen und den Fortschritt zum Renntag messen. Läuft offline als installierbare App.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hyrox Coach",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
  // Zusätzlicher generischer PWA-Meta-Tag (neben apple-mobile-web-app-capable)
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Wichtig für env(safe-area-inset-*) auf iOS (Notch/Home-Indicator)
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de-CH" suppressHydrationWarning>
      <head>
        {/* Setzt das Theme, bevor gerendert wird (verhindert Flackern). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
