type PulseBlockProps = {
  className: string;
};

function PulseBlock({ className }: PulseBlockProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--md-sys-color-surface-container-high)] ${className}`}
    />
  );
}

function SettingsCardShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--md-sys-color-outline-variant)" }}
    >
      {children}
    </section>
  );
}

export function SettingsProfileCardSkeleton() {
  return (
    <SettingsCardShell>
      <div className="space-y-2">
        <PulseBlock className="h-5 w-40" />
        <PulseBlock className="h-4 w-3/4" />
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-4 rounded-lg border p-4" style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
          <PulseBlock className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <PulseBlock className="h-4 w-28" />
            <PulseBlock className="h-3 w-20" />
          </div>
        </div>

        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <PulseBlock className="h-4 w-24" />
            <PulseBlock className="h-10 w-full" />
          </div>
        ))}

        <div className="flex items-center gap-3">
          <PulseBlock className="h-10 w-28" />
          <PulseBlock className="h-10 w-24" />
        </div>
      </div>
    </SettingsCardShell>
  );
}

export function SettingsScheduleCardSkeleton() {
  return (
    <SettingsCardShell>
      <div className="space-y-2">
        <PulseBlock className="h-5 w-36" />
        <PulseBlock className="h-4 w-2/3" />
      </div>

      <div className="mt-4 grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border p-4"
            style={{ borderColor: "var(--md-sys-color-outline-variant)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <PulseBlock className="h-5 w-24" />
              <PulseBlock className="h-5 w-16" />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((__, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <PulseBlock className="h-4 w-16" />
                  <PulseBlock className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <PulseBlock className="h-10 w-28" />
      </div>
    </SettingsCardShell>
  );
}

export function SettingsIntegrationCardSkeleton() {
  return (
    <SettingsCardShell>
      <div className="space-y-2">
        <PulseBlock className="h-5 w-44" />
        <PulseBlock className="h-4 w-3/4" />
      </div>

      <div className="mt-4 space-y-3">
        <PulseBlock className="h-4 w-1/2" />
        <PulseBlock className="h-10 w-40" />
      </div>
    </SettingsCardShell>
  );
}