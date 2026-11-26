import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import "./theme.css";

export const metadata: Metadata = {
  title: { default: "Neuravic Portal", template: "%s — Neuravic Portal" },
  description: "The Neuravic internal portal: your profile, tools, calendar and IT support.",
  robots: { index: false, follow: false },
  icons: { icon: "/assets/neuravic-mark.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#070A12" },
    { media: "(prefers-color-scheme: dark)", color: "#070A12" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The chosen theme comes from a cookie so the server can render it, with no flash of the wrong colours.
  const saved = (await cookies()).get("nv_theme")?.value;
  const theme = saved === "light" || saved === "dark" ? saved : undefined;

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://use.typekit.net/okn5dwf.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
