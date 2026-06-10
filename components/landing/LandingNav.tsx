import Image from "next/image";
import Link from "next/link";

export default function LandingNav() {
  return (
    <nav
      className="sticky top-0 z-40 w-full border-b"
      style={{
        background: "var(--md-sys-color-surface)",
        borderColor: "var(--md-sys-color-outline-variant)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo, matches SidebarClient LogoRow pattern */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/assets/IconRet.png"
            alt="GuidanceGO logo"
            width={40}
            height={27}
            className="object-contain"
            priority
          />
          <span className="flex flex-col leading-tight">
            <span
              className="text-lg font-bold whitespace-nowrap"
              style={{
                fontFamily:
                  "system-ui, -apple-system, 'Segoe UI', 'Inter', sans-serif",
                color: "var(--md-sys-color-on-surface)",
              }}
            >
              <span className="text-[#003D99] dark:text-white">Guidance</span>
              <span className="text-[#4CAF50] dark:text-white">GO</span>
            </span>
            <span
              className="text-[10px] whitespace-nowrap"
              style={{
                fontFamily:
                  "system-ui, -apple-system, 'Segoe UI', 'Inter', sans-serif",
                color: "var(--md-sys-color-on-surface-variant)",
              }}
            >
              Fast &amp; Secure
            </span>
          </span>
        </Link>

        {/* CTA */}
        <Link
          href="/login"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            background: "var(--md-sys-color-primary)",
            color: "var(--md-sys-color-on-primary)",
            boxShadow: "var(--md-sys-elevation-level1)",
          }}
        >
          Book a Session
        </Link>
      </div>
    </nav>
  );
}
