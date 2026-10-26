import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Neuravic Portal", template: "%s — Neuravic Portal" },
  description: "The Neuravic internal portal: your profile, tools, calendar and IT support.",
  robots: { index: false, follow: false },
  icons: { icon: "/assets/neuravic-mark.png" },
};

export const viewport: Viewport = {
  themeColor: "#070A12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://use.typekit.net/okn5dwf.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
