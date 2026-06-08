type PulseBlockProps = {
  className: string;
};

export function PulseBlock({ className }: PulseBlockProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[var(--md-sys-color-surface-container-high)] ${className}`}
    />
  );
}

export function DashboardStatsRowSkeleton({ compact = false }: { compact?: boolean }) {
  const cardClassName = compact ? "rounded-2xl p-5 gap-2" : "rounded-3xl p-8 gap-3";
  const valueClassName = compact ? "h-9 w-16" : "h-12 w-20";
  const rowClassName = compact
    ? "grid grid-cols-2 gap-3 py-1 lg:grid-cols-4"
    : "grid grid-cols-1 gap-6 py-4 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={rowClassName}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={`flex flex-col ${cardClassName}`}
          style={{
            background: "var(--md-sys-color-surface)",
            border: "1px solid var(--md-sys-color-outline-variant)",
            boxShadow: "var(--md-sys-elevation-level1)",
          }}
        >
          <PulseBlock className="h-4 w-20" />
          <PulseBlock className={valueClassName} />
          <PulseBlock className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function DashboardHeroCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[var(--guidance-next-session-bg)] p-5 md:p-6 shadow-xl">
      <div className="flex flex-col items-center gap-3 text-center md:text-left">
        <div className="animate-pulse rounded-full bg-white/20 h-5 w-28" />
        <div className="animate-pulse rounded-2xl bg-white/20 h-8 w-2/3" />
        <div className="animate-pulse rounded-2xl bg-white/20 h-4 w-1/2" />
      </div>
    </div>
  );
}

export function DashboardAppointmentsPanelSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="flex flex-col gap-3">
          <PulseBlock className="h-6 w-52" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-center gap-4 rounded-3xl p-5"
                style={{
                  background: "var(--md-sys-color-surface)",
                  border: "1px solid var(--md-sys-color-outline-variant)",
                  boxShadow: "var(--md-sys-elevation-level1)",
                }}
              >
                <PulseBlock className="h-20 w-20 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <PulseBlock className="h-3 w-24" />
                  <PulseBlock className="h-5 w-3/4" />
                  <PulseBlock className="h-4 w-1/2" />
                </div>
                <PulseBlock className="h-10 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function DashboardCardSkeleton({
  showRows = 3,
}: {
  showRows?: number;
}) {
  return (
    <div
      className="w-full rounded-xl"
      style={{
        background: "var(--md-sys-color-surface)",
        border: "1px solid var(--md-sys-color-outline-variant)",
        boxShadow: "var(--md-sys-elevation-level1)",
      }}
    >
      <div className="space-y-2 p-6 pb-4">
        <PulseBlock className="h-5 w-36" />
        <PulseBlock className="h-4 w-24" />
      </div>
      <div className="flex flex-col gap-3 p-6 pt-0">
        {Array.from({ length: showRows }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border p-4"
            style={{
              borderColor: "var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface-container-low)",
            }}
          >
            <PulseBlock className="h-4 w-1/2" />
            <PulseBlock className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardCalendarSkeleton() {
  return (
    <div className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between px-2">
        <PulseBlock className="h-7 w-40" />
        <div className="flex gap-2">
          <PulseBlock className="h-8 w-8 rounded-full" />
          <PulseBlock className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <PulseBlock key={index} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function DashboardTodayOverviewSkeleton() {
  return (
    <div
      className="w-full rounded-xl"
      style={{
        background: "var(--md-sys-color-surface)",
        border: "1px solid var(--md-sys-color-outline-variant)",
        boxShadow: "var(--md-sys-elevation-level1)",
      }}
    >
      <div className="space-y-2 p-6 pb-4">
        <PulseBlock className="h-4 w-28" />
      </div>
      <div className="flex gap-3 p-6 pt-0">
        <PulseBlock className="h-20 flex-1" />
        <PulseBlock className="h-20 flex-1" />
      </div>
    </div>
  );
}

export function DashboardSidebarSkeleton({
  showBanner = false,
  showList = false,
}: {
  showBanner?: boolean;
  showList?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      {showBanner ? (
        <div className="rounded-xl bg-[var(--md-sys-color-tertiary-container)] p-4">
          <PulseBlock className="h-4 w-3/4 bg-white/25" />
          <PulseBlock className="mt-2 h-3 w-full bg-white/20" />
        </div>
      ) : null}
      <DashboardCalendarSkeleton />
      {showList ? (
        <>
          <DashboardCardSkeleton showRows={4} />
          <DashboardCardSkeleton showRows={1} />
        </>
      ) : null}
    </div>
  );
}