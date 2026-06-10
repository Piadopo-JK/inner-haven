import { Badge } from "@/components/ui/badge";
import { UserSearch, CalendarCheck, CheckCircle2, Video } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: UserSearch,
    title: "Choose Your Counselor",
    description:
      "Browse counselor profiles, specialties, and availability to find the right match for you.",
  },
  {
    number: 2,
    icon: CalendarCheck,
    title: "Pick a Date & Time",
    description:
      "Select a convenient time slot from real-time availability, no back-and-forth emails.",
  },
  {
    number: 3,
    icon: CheckCircle2,
    title: "Confirm Your Booking",
    description:
      "Review the details and book instantly. You'll receive a confirmation right away.",
  },
  {
    number: 4,
    icon: Video,
    title: "Join via Google Meet",
    description:
      "Click the secure video link at your appointment time. No downloads required.",
  },
] as const;

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          className="mb-2 text-center text-3xl font-bold tracking-tight"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          How It Works
        </h2>
        <p
          className="mb-10 text-center"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        >
          Four simple steps to connect with a counselor
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="flex flex-col items-center gap-4 rounded-3xl p-6 text-center"
                style={{
                  background: "var(--md-sys-color-surface)",
                  border: "1px solid var(--md-sys-color-outline-variant)",
                  boxShadow: "var(--md-sys-elevation-level1)",
                }}
              >
                <Badge
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: "var(--md-sys-color-primary-container)",
                    color: "var(--md-sys-color-on-primary-container)",
                    border: "none",
                  }}
                >
                  {step.number}
                </Badge>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background: "var(--md-sys-color-secondary-container)",
                    color: "var(--md-sys-color-on-secondary-container)",
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3
                  className="text-base font-bold"
                  style={{ color: "var(--md-sys-color-on-surface)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                >
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
