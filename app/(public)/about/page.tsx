export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="mb-2 text-4xl font-bold tracking-tight"
        style={{ color: "var(--md-sys-color-on-surface)" }}
      >
        About GuidanceGo
      </h1>
      <p
        className="mb-10 text-sm"
        style={{ color: "var(--md-sys-color-on-surface-variant)" }}
      >
        A secure counseling management platform for Visayas State University
      </p>

      <section className="space-y-10">
        <div>
          <h2
            className="mb-3 text-xl font-bold tracking-tight"
            style={{ color: "var(--md-sys-color-on-surface)" }}
          >
            Our Mission
          </h2>
          <p
            className="leading-relaxed"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            We aim to make counseling services more accessible, private, and
            efficient for the VSU community — reducing barriers to mental health
            support through technology.
          </p>
        </div>

        <div>
          <h2
            className="mb-4 text-xl font-bold tracking-tight"
            style={{ color: "var(--md-sys-color-on-surface)" }}
          >
            Key Features
          </h2>
          <ul className="space-y-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-sm" style={{ color: "var(--md-sys-color-primary)" }}>●</span>
              <span><strong style={{ color: "var(--md-sys-color-on-surface)" }}>Online Counseling</strong> - Secure Google Meet integration with OAuth 2.0 for counselor-hosted sessions.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-sm" style={{ color: "var(--md-sys-color-primary)" }}>●</span>
              <span><strong style={{ color: "var(--md-sys-color-on-surface)" }}>Anonymous Help Requests</strong> - Students can reach out without revealing their identity.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-sm" style={{ color: "var(--md-sys-color-primary)" }}>●</span>
              <span><strong style={{ color: "var(--md-sys-color-on-surface)" }}>Real-Time Updates</strong> - Appointment status and messages sync instantly via Supabase Realtime.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-sm" style={{ color: "var(--md-sys-color-primary)" }}>●</span>
              <span><strong style={{ color: "var(--md-sys-color-on-surface)" }}>Role-Based Access</strong> - Strict separation between student and counselor permissions.</span>
            </li>
          </ul>
        </div>

        <div>
          <h2
            className="mb-6 text-xl font-bold tracking-tight"
            style={{ color: "var(--md-sys-color-on-surface)" }}
          >
            Project Team
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className="rounded-2xl border p-5 flex flex-col items-center text-center gap-3"
              style={{
                background: "var(--md-sys-color-surface)",
                borderColor: "var(--md-sys-color-outline-variant)",
                boxShadow: "var(--md-sys-elevation-level1)",
              }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  background: "var(--md-sys-color-primary-container)",
                  color: "var(--md-sys-color-on-primary-container)",
                }}
              >
                JKP
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                  John Kyle A. Piadopo
                </p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--md-sys-color-primary)" }}>
                  Project Lead
                </p>
              </div>
              <a
                href="https://github.com/Piadopo-JK"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  background: "var(--md-sys-color-surface-container-high)",
                  color: "var(--md-sys-color-on-surface-variant)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>

            <div
              className="rounded-2xl border p-5 flex flex-col items-center text-center gap-3"
              style={{
                background: "var(--md-sys-color-surface)",
                borderColor: "var(--md-sys-color-outline-variant)",
                boxShadow: "var(--md-sys-elevation-level1)",
              }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  background: "var(--md-sys-color-tertiary-container)",
                  color: "var(--md-sys-color-on-tertiary-container)",
                }}
              >
                RMP
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                  Rico Martin Carl V. Posas
                </p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--md-sys-color-tertiary)" }}>
                  Lead Developer
                </p>
              </div>
              <a
                href="https://github.com/Kissu1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  background: "var(--md-sys-color-surface-container-high)",
                  color: "var(--md-sys-color-on-surface-variant)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>

            <div
              className="rounded-2xl border p-5 flex flex-col items-center text-center gap-3"
              style={{
                background: "var(--md-sys-color-surface)",
                borderColor: "var(--md-sys-color-outline-variant)",
                boxShadow: "var(--md-sys-elevation-level1)",
              }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  background: "var(--md-sys-color-secondary-container)",
                  color: "var(--md-sys-color-on-secondary-container)",
                }}
              >
                RAS
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                  Ruel Angelo P. Sinday
                </p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--md-sys-color-secondary)" }}>
                  Lead Tester / Lead Designer
                </p>
              </div>
              <a
                href="https://github.com/RASinday"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  background: "var(--md-sys-color-surface-container-high)",
                  color: "var(--md-sys-color-on-surface-variant)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
