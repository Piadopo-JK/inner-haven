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

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="mb-2 text-4xl font-bold tracking-tight"
        style={{ color: "var(--md-sys-color-on-surface)" }}
      >
        Terms of Service
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
        <SectionHeading>1. Acceptance of Terms</SectionHeading>
        <SectionBody>
          By accessing or using GuidanceGo, you agree to be bound by these Terms
          of Service. If you do not agree, please discontinue use of the
          platform immediately.
        </SectionBody>

        <SectionHeading>2. Description of Service</SectionHeading>
        <SectionBody>
          GuidanceGo is a counseling management platform for Visayas State
          University (VSU). It facilitates appointment scheduling, secure
          messaging, and Google Meet-based online counseling sessions between
          students and certified counselors.
        </SectionBody>

        <SectionHeading>3. User Responsibilities</SectionHeading>
        <SectionBody>
          Users are expected to provide accurate information, respect the
          confidentiality of communications, and refrain from misusing the
          platform. Counselors are responsible for maintaining the security of
          their Google account credentials.
        </SectionBody>

        <SectionHeading>4. Limitation of Liability</SectionHeading>
        <SectionBody>
          GuidanceGo is provided &quot;as is&quot; without warranties of any
          kind. The platform team is not liable for damages arising from
          third-party service outages, including Google Meet or Supabase.
        </SectionBody>

        <SectionHeading>5. Changes to Terms</SectionHeading>
        <SectionBody>
          We reserve the right to update these terms at any time. Continued use
          of the platform after changes constitutes acceptance of the revised
          terms.
        </SectionBody>

        <SectionHeading>6. Contact</SectionHeading>
        <SectionBody>
          For questions about these Terms, visit our{" "}
          <a href="/contact" style={{ color: "var(--md-sys-color-primary)" }} className="underline">
            Contact
          </a>{" "}
          page.
        </SectionBody>
      </section>
    </main>
  );
}
