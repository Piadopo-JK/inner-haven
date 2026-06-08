"use client";

import AvailableCounselorsList from "@/components/counselor/AvailableCounselorsList";
import { useCounselors } from "@/lib/query/hooks/useCounselors";

export default function CounselorsContent() {
  const { data: counselors } = useCounselors();

  return (
    <main
      className="min-h-screen w-full px-4 py-8"
      style={{ background: "var(--md-sys-color-background)" }}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section
          className="rounded-[20px] px-8 py-10"
          style={{
            background: "var(--md-sys-color-surface-container-low)",
            boxShadow: "var(--md-sys-elevation-level2)",
          }}
        >
          <h1
            className="text-4xl font-bold"
            style={{ color: "var(--md-sys-color-primary)" }}
          >
            Find Your Counselor
          </h1>
          <p
            className="mt-2 max-w-xl text-sm leading-relaxed"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            Browse our team of professional counselors. Choose the person who
            feels right for you and book a session at a time that works.
          </p>
        </section>

        <AvailableCounselorsList counselors={counselors ?? []} canBook canMessage />
      </div>
    </main>
  );
}
