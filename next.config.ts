import type { NextConfig } from "next";

/**
 * Baseline security headers, matching the main Neuravic site. The Content Security Policy is set per request in
 * proxy.ts, because it carries a fresh nonce.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // A self-contained server in .next/standalone, which keeps the Docker image small.
  output: "standalone",
  // Do not advertise the framework in every response.
  poweredByHeader: false,
  reactStrictMode: true,
  // Tree-shake icon libraries so each page only ships the icons it uses.
  experimental: { optimizePackageImports: ["lucide-react"] },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Pages hold personal data and must never be kept by a shared cache.
      { source: "/((?!_next/static|assets).*)", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      // The logo never changes under the same name, so browsers may keep it.
      { source: "/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
