"use client";

import { Menu } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Home", href: "/dashboard" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export default function HamburgerMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-screen h-screen p-6 md:w-48 md:h-auto"
        style={{
          background: "var(--md-sys-color-surface)",
          borderColor: "var(--md-sys-color-outline-variant)",
        }}
      >
        <div className="flex h-full flex-col items-stretch justify-center gap-2 md:justify-start">
          {navLinks.map((link, index) => (
            <span key={link.href}>
              <DropdownMenuItem asChild>
                <Link
                  href={link.href}
                  className="block w-full cursor-pointer text-lg font-semibold py-3 text-center"
                  style={{ color: "var(--md-sys-color-on-surface)" }}
                >
                  {link.label}
                </Link>
              </DropdownMenuItem>
              {index < navLinks.length - 1 && <DropdownMenuSeparator />}
            </span>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
