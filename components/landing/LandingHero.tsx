import Link from "next/link";

export default function LandingHero() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <h1
          className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          Your Mental Health{" "}
          <span style={{ color: "var(--md-sys-color-primary)" }}>Matters</span>
        </h1>
        <p
          className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        >
          Book a private counseling session in minutes. Connect with experienced
          counselors through secure video calls, right from your device.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/login"
            className="inline-block rounded-xl px-8 py-3 text-base font-semibold transition-opacity hover:opacity-90"
            style={{
              background: "var(--md-sys-color-primary)",
              color: "var(--md-sys-color-on-primary)",
              boxShadow: "var(--md-sys-elevation-level2)",
            }}
          >
            Book a Session
          </Link>
          <a
            href="#how-it-works"
            className="inline-block rounded-xl border-2 px-8 py-3 text-base font-semibold transition-colors"
            style={{
              borderColor: "var(--md-sys-color-outline)",
              color: "var(--md-sys-color-primary)",
            }}
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
