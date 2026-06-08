import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 86400,
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
    ],
  },

  async rewrites() {
    return [
      { source: "/login", destination: "/auth/login" },
      { source: "/sign-up", destination: "/auth/sign-up" },
      { source: "/sign-up-success", destination: "/auth/sign-up-success" },
      { source: "/forgot-password", destination: "/auth/forgot-password" },
      { source: "/update-password", destination: "/auth/update-password" },
    ];
  },

  async redirects() {
    return [
      { source: "/auth/login", destination: "/login", permanent: true },
      { source: "/auth/sign-up", destination: "/sign-up", permanent: true },
      { source: "/auth/forgot-password", destination: "/forgot-password", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
              `style-src 'self' 'unsafe-inline'`,
              `img-src 'self' data: blob: https://lh3.googleusercontent.com ${supabaseHost ? `https://${supabaseHost}` : ""}`,
              `font-src 'self'`,
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://meet.googleapis.com https://oauth2.googleapis.com`,
              `frame-ancestors 'none'`,
              `form-action 'self'`,
              `base-uri 'self'`,
              `object-src 'none'`,
            ]
              .filter(Boolean)
              .join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
