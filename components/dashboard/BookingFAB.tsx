"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function BookingFAB() {
  return (
    <Link
      href="/appointments/new"
      className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xl hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] transition-all duration-300 group hover:scale-105"
    >
      <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
      <span className="font-bold text-sm tracking-wide">Book Session</span>
    </Link>
  );
}
