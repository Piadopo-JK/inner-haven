function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-3 text-lg font-bold tracking-tight"
      style={{ color: "var(--md-sys-color-on-surface)" }}
    >
      {children}
    </h2>
  );
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-6 leading-relaxed"
      style={{ color: "var(--md-sys-color-on-surface-variant)" }}
    >
      {children}
    </p>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="mb-2 text-4xl font-bold tracking-tight"
        style={{ color: "var(--md-sys-color-on-surface)" }}
      >
        Privacy Policy
      </h1>
      <p
        className="mb-10 text-sm"
        style={{ color: "var(--md-sys-color-on-surface-variant)" }}
      >
        Effective Date:{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <section>
        <SectionHeading>1. Information We Collect</SectionHeading>
        <SectionBody>
          GuidanceGo collects only the information necessary to provide our
          counseling platform services. This includes account credentials,
          appointment records, and messages exchanged between students and
          counselors. We do not sell or share your personal data with third
          parties.
        </SectionBody>

        <SectionHeading>2. Anonymous Help Requests</SectionHeading>
        <SectionBody>
          GuidanceGo offers an &quot;Anonymous&quot; help request feature. When
          you submit a request anonymously, your identity is hidden from the
          counselor, they see only a generic &quot;Anonymous Student&quot;
          label. However, for safety, platform integrity, and compliance with
          institutional policies, your request remains associated with your
          account in our systems. This means administrators may access the
          association in exceptional circumstances (e.g., imminent harm
          concerns or legal requirements). Anonymous does not mean untraceable.
        </SectionBody>

        <SectionHeading>3. How We Use Your Data</SectionHeading>
        <SectionBody>
          Your data is used solely to facilitate counseling sessions, manage
          appointments, and maintain the security of the platform. Google Meet
          integration data, including OAuth tokens is handled in-memory and
          never persisted to logs or external storage.
        </SectionBody>

        <SectionHeading>4. Data Security</SectionHeading>
        <SectionBody>
          Sensitive fields such as OAuth refresh tokens are encrypted at rest.
          All communication between clients and our servers is transmitted over
          HTTPS. Access to personal data is restricted to authorized roles
          within the platform.
        </SectionBody>

        <SectionHeading>5. Contact</SectionHeading>
        <SectionBody>
          If you have questions about this Privacy Policy, please reach out via
          our{" "}
          <a href="/contact" style={{ color: "var(--md-sys-color-primary)" }} className="underline">
            Contact
          </a>{" "}
          page.
        </SectionBody>
      </section>
    </main>
  );
}
