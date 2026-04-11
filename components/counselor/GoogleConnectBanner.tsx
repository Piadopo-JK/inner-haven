"use client";

interface GoogleConnectBannerProps {
  isConnected: boolean;
}

export default function GoogleConnectBanner({ isConnected }: GoogleConnectBannerProps) {
  if (isConnected) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
      style={{
        background: "var(--md-sys-color-tertiary-container)",
        color: "var(--md-sys-color-on-tertiary-container)",
      }}
    >
      <div>
        <p className="font-medium">Connect your Google account to enable Meet links for online sessions.</p>
        <p className="mt-0.5 text-xs opacity-75">
          Students who book online appointments won&#39;t receive a Meet link until you connect.
        </p>
      </div>
      <a
        href="/api/auth/google/initiate"
        className="ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
        style={{
          background: "var(--md-sys-color-on-tertiary-container)",
          color: "var(--md-sys-color-tertiary-container)",
        }}
      >
        Connect Google
      </a>
    </div>
  );
}
