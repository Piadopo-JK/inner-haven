function PulseBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[var(--md-sys-color-surface-container-high)] ${className}`}
    />
  );
}

export default function AppointmentsLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 md:px-6">
      <div className="flex flex-col gap-10 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <PulseBlock className="h-10 w-52" />

          <div className="flex gap-1 p-1.5 rounded-2xl bg-[var(--md-sys-color-surface-container-high)]">
            <PulseBlock className="h-9 w-24 rounded-xl" />
            <PulseBlock className="h-9 w-24 rounded-xl" />
            <PulseBlock className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-3xl p-5"
              style={{
                background: "var(--md-sys-color-surface)",
                border: "1px solid var(--md-sys-color-outline-variant)",
                boxShadow: "var(--md-sys-elevation-level1)",
              }}
            >
              <PulseBlock className="h-16 w-16 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <PulseBlock className="h-3 w-20" />
                <PulseBlock className="h-5 w-3/4" />
                <PulseBlock className="h-4 w-1/2" />
              </div>
              <PulseBlock className="h-10 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
