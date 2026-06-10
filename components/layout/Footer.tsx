import Link from "next/link";

const footerLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-container-lowest">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-3 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
        <span className="hidden sm:inline">&copy; {new Date().getFullYear()} GuidanceGo</span>
        {footerLinks.map((link, i) => (
          <span key={link.href} className="flex items-center gap-2 sm:gap-4">
            {i > 0 && (
              <span aria-hidden="true" className="text-outline-variant">
                &middot;
              </span>
            )}
            <Link
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </span>
        ))}
      </div>
    </footer>
  );
}
