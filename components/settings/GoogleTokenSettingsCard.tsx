"use client";

import { Md3Message } from "@/components/ui/md3-message";

import { Button } from "@/components/ui/button";
import {
  useGoogleIntegrationStatus,
  useRevokeGoogleAccess,
} from "@/lib/query/hooks/useGoogleToken";

export default function GoogleTokenSettingsCard() {
  const {
    data: googleIntegration,
    isLoading,
    error: loadError,
  } = useGoogleIntegrationStatus();
  const {
    mutateAsync: revokeGoogleAccess,
    isPending: isSubmitting,
    error: revokeError,
    reset: resetRevokeError,
  } = useRevokeGoogleAccess();
  const connected = googleIntegration?.isConnected ?? false;

  async function handleRevoke() {
    try {
      resetRevokeError();
      await revokeGoogleAccess();
    } catch {}
  }

  const errorMessage = loadError
    ? loadError instanceof Error
      ? loadError.message
      : "Unable to load Google integration state."
    : revokeError
      ? revokeError instanceof Error
        ? revokeError.message
        : "Failed to revoke Google access."
      : null;

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
      <h2 className="text-base font-semibold">Google Meet Integration</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage the Google refresh token used to generate Meet links for approved online sessions.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading Google integration...</p>
      ) : errorMessage && !connected ? (
        <Md3Message tone="error" className="mt-4">
          {errorMessage}
        </Md3Message>
      ) : connected ? (
        <div className="mt-4">
          <p className="text-sm">Google account is currently connected.</p>
          <Button
            type="button"
            variant="destructive"
            className="mt-3"
            onClick={handleRevoke}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Revoking..." : "Revoke Google Access"}
          </Button>
          {errorMessage ? (
            <Md3Message tone="error" className="mt-3">
              {errorMessage}
            </Md3Message>
          ) : null}
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm">No Google refresh token is stored.</p>
          <a
            href="/api/auth/google/initiate"
            className="mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: "var(--md-sys-color-tertiary-container)",
              color: "var(--md-sys-color-on-tertiary-container)",
            }}
          >
            Connect Google
          </a>
        </div>
      )}
    </section>
  );
}
