import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  // Only allow local-network origins in development
  allowedDevOrigins: isDev
    ? ['192.168.100.10', '192.168.1.*', '192.168.0.*', '10.0.*.*']
    : [],
  // HTTP security headers applied to every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          ...(isDev ? [] : [
            // Enforce HTTPS for 1 year in production (don't send in dev — breaks localhost)
            { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          ]),
        ],
      },
    ]
  },
  experimental: {
    // Next 15 specific settings if needed
  },
};

export default withPWA(nextConfig);
