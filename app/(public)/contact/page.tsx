export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="mb-10 text-4xl font-bold tracking-tight"
        style={{ color: "var(--md-sys-color-on-surface)" }}
      >
        Contact Us
      </h1>

      <section>
        <p>
          Have questions, feedback, or need support? Reach out to the
          GuidanceGo team.
        </p>

        <h2>Email :</h2>
        <p>
          <a href="mailto:guidance.go.ih@gmail.com" className="text-primary underline">
            guidance.go.ih@gmail.com
          </a>
        </p>
      </section>
    </main>
  );
}
