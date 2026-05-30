type PulseBlockProps = {
  className: string;
};

function PulseBlock({ className }: PulseBlockProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[var(--md-sys-color-surface-container-high)] ${className}`}
    />
  );
}

export default function BookingPageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-12 space-y-3">
        <PulseBlock className="h-11 w-80" />
        <PulseBlock className="h-6 w-[36rem] max-w-full" />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-10">
          <div className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-8 shadow-sm">
            <PulseBlock className="mb-6 h-8 w-56" />
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] p-4"
                >
                  <PulseBlock className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <PulseBlock className="h-4 w-40" />
                    <PulseBlock className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-6 shadow-sm">
          <PulseBlock className="h-6 w-48" />
          <div className="mt-6 space-y-4">
            <PulseBlock className="h-4 w-36" />
            <PulseBlock className="h-12 w-full" />
            <PulseBlock className="h-4 w-32" />
            <PulseBlock className="h-12 w-full" />
            <PulseBlock className="h-4 w-24" />
            <PulseBlock className="h-12 w-full" />
          </div>
          <PulseBlock className="mt-8 h-12 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}