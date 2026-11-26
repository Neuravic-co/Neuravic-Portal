import { NextResponse, type NextRequest } from "next/server";

/**
 * Sets a Content Security Policy with a fresh nonce for every request. Scripts only run if they carry that nonce
 * (Next adds it to its own scripts), so an injected <script> or inline handler is blocked. Pages are rendered per
 * request already (they read the session cookie), which is what nonces need.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";

  const policy = [
    "default-src 'self'",
    // React uses eval for debugging information in development only.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Typekit serves the brand fonts; the progress bar uses an inline style attribute, so styles cannot use a nonce.
    "style-src 'self' 'unsafe-inline' https://use.typekit.net https://p.typekit.net",
    "font-src 'self' https://use.typekit.net https://p.typekit.net",
    "img-src 'self' data: blob: https://p.typekit.net",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      // Skip static files and prefetches: they are not documents and do not need a nonce.
      source: "/((?!_next/static|_next/image|assets|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
