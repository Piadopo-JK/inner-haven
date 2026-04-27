export default function MessagingPage() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 p-4">
      <section
        className="rounded-2xl border p-8"
        style={{
          background: "var(--md-sys-color-surface)",
          borderColor: "var(--md-sys-color-outline-variant)",
        }}
      >
        <h1 className="text-xl font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
          Messaging
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
          Messaging is coming soon. You can continue using appointments and notifications in the meantime.
        </p>
      </section>
    </main>
  );
}
