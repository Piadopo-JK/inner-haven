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

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="mb-10 text-4xl font-bold tracking-tight"
        style={{ color: "var(--md-sys-color-on-surface)" }}
      >
        Disclaimer
      </h1>

      <section>
        <SectionHeading>No Emergency Service</SectionHeading>
        <SectionBody>
          GuidanceGo is <strong>not</strong> an emergency or crisis intervention
          service. If you are experiencing a mental health emergency, please
          contact your local emergency services or a crisis hotline immediately.
        </SectionBody>

        <SectionHeading>Not a Substitute for Professional Care</SectionHeading>
        <SectionBody>
          The counseling services provided through GuidanceGo are intended to
          supplement — not replace — in-person professional mental health care,
          diagnosis, or treatment. Always seek the advice of qualified health
          providers.
        </SectionBody>

        <SectionHeading>Third-Party Services</SectionHeading>
        <SectionBody>
          GuidanceGo integrates with Google Meet for video sessions. We are not
          responsible for the availability, security, or privacy practices of
          third-party services. Use of Google Meet is subject to Google&apos;s
          own Terms of Service and Privacy Policy.
        </SectionBody>

        <SectionHeading>Platform Availability</SectionHeading>
        <SectionBody>
          While we strive for high availability, GuidanceGo may experience
          downtime due to maintenance or unforeseen issues. We are not liable
          for any inconvenience caused by temporary unavailability.
        </SectionBody>

        <SectionHeading>Limitation of Liability</SectionHeading>
        <SectionBody>
          To the fullest extent permitted by law, the GuidanceGo team and
          Visayas State University disclaim all liability for any damages
          arising from the use of this platform.
        </SectionBody>
      </section>
    </main>
  );
}
