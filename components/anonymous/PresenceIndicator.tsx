export default function PresenceIndicator({ counselorCount }: { counselorCount: number }) {
  const isAvailable = counselorCount > 0;

  return (
    <div
      className="rounded-xl border px-3 py-2 text-sm"
      style={{
        borderColor: "var(--md-sys-color-outline-variant)",
        color: "var(--md-sys-color-on-surface-variant)",
        background: "var(--md-sys-color-surface-container-low)",
      }}
    >
      {isAvailable
        ? `${counselorCount} counselor${counselorCount === 1 ? "" : "s"} available for anonymous support.`
        : "No counselors listed right now. You can still leave an anonymous request."}
    </div>
  );
}
