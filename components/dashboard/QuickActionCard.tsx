"use client";

import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";

export default function QuickActionCard() {
  return (
    <DashboardCard title="Quick Actions">
      <Button
        asChild
        className="rounded-full"
        style={{
          background: "var(--md-sys-color-primary)",
          color: "var(--md-sys-color-on-primary)",
        }}
      >
        <Link href="/appointments/new">Book Appointment</Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        className="rounded-full"
        style={{
          border: "1px solid var(--md-sys-color-outline)",
          color: "var(--md-sys-color-primary)",
        }}
      >
        <Link href="/appointments">My Appointments</Link>
      </Button>
    </DashboardCard>
  );
}
