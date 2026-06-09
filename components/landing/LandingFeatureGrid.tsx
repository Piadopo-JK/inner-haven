import { ShieldCheck, Video, Bell, Smartphone } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Privacy & Anonymity",
    description:
      "Send anonymous help requests without revealing your identity. Your conversations stay confidential.",
    accentBg: "var(--md-sys-color-primary-container)",
    accentFg: "var(--md-sys-color-on-primary-container)",
  },
  {
    icon: Video,
    title: "Google Meet Integration",
    description:
      "Secure video sessions via OAuth 2.0. No extra apps needed, just click and connect.",
    accentBg: "var(--md-sys-color-secondary-container)",
    accentFg: "var(--md-sys-color-on-secondary-container)",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description:
      "Get timely notifications for upcoming appointments, status changes, and new messages.",
    accentBg: "var(--md-sys-color-tertiary-container)",
    accentFg: "var(--md-sys-color-on-tertiary-container)",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description:
      "Book and manage sessions from any device. Responsive design that works everywhere.",
    accentBg: "var(--md-sys-color-primary-container)",
    accentFg: "var(--md-sys-color-on-primary-container)",
  },
] as const;

export default function LandingFeatureGrid() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          className="mb-2 text-center text-3xl font-bold tracking-tight"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          Why GuidanceGO
        </h2>
        <p
          className="mb-10 text-center"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        >
          Built with your privacy and convenience in mind
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex gap-4 rounded-2xl p-6"
                style={{
                  background: "var(--md-sys-color-surface)",
                  border: "1px solid var(--md-sys-color-outline-variant)",
                  boxShadow: "var(--md-sys-elevation-level1)",
                }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: feature.accentBg,
                    color: feature.accentFg,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3
                    className="mb-1 text-base font-bold"
                    style={{ color: "var(--md-sys-color-on-surface)" }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
