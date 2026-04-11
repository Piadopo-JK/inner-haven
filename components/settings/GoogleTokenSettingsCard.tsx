"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface GoogleTokenSettingsCardProps {
  isConnected: boolean;
}

export default function GoogleTokenSettingsCard({ isConnected }: GoogleTokenSettingsCardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/google/disconnect", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Unable to revoke Google access right now.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke Google access.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
      <h2 className="text-base font-semibold">Google Meet Integration</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage the Google refresh token used to generate Meet links for approved online sessions.
      </p>

      {isConnected ? (
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

      {error ? (
        <p className="mt-3 text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
