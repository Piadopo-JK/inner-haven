import { CalendarCheck, ShieldCheck, Video, Zap } from "lucide-react";

const highlights = [
  {
    icon: CalendarCheck,
    title: "Real-Time Availability",
    description:
      "See live, up-to-date counselor schedules, no outdated slots or guessing games.",
    accentBg: "var(--md-sys-color-primary-container)",
    accentFg: "var(--md-sys-color-on-primary-container)",
  },
  {
    icon: ShieldCheck,
    title: "Private by Default",
    description:
      "Anonymous help requests, confidential sessions, and data handled through secure infrastructure.",
    accentBg: "var(--md-sys-color-secondary-container)",
    accentFg: "var(--md-sys-color-on-secondary-container)",
  },
  {
    icon: Video,
    title: "Seamless Video Sessions",
    description:
      "Google Meet integration with OAuth 2.0, join your session with a single click.",
    accentBg: "var(--md-sys-color-tertiary-container)",
    accentFg: "var(--md-sys-color-on-tertiary-container)",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    description:
      "Pick a slot, confirm, done. No waiting for approvals or email chains.",
    accentBg: "var(--md-sys-color-primary-container)",
    accentFg: "var(--md-sys-color-on-primary-container)",
  },
] as const;

function HighlightCard({
  icon: Icon,
  title,
  description,
  accentBg,
  accentFg,
}: (typeof highlights)[number]) {
  return (
    <div
      className="flex gap-4 rounded-2xl p-5 transition-shadow hover:shadow-md"
      style={{
        background: "var(--md-sys-color-surface)",
        border: "1px solid var(--md-sys-color-outline-variant)",
        boxShadow: "var(--md-sys-elevation-level1)",
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accentBg, color: accentFg }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p
          className="text-sm font-bold"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          {title}
        </p>
        <p
          className="mt-1 text-sm leading-relaxed"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

export default function LandingStats() {
  return (
    <section className="pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <HighlightCard key={h.title} {...h} />
          ))}
        </div>
      </div>
    </section>
  );
}
