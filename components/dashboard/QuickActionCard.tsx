"use client";

import * as React from "react";

import BookingModal from "@/components/appointments/BookingModal";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";

export default function QuickActionCard() {
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);

  return (
    <DashboardCard title="Quick Action Card">
      <Button variant="secondary" onClick={() => setIsBookingOpen(true)}>
        Book
      </Button>
      <Button variant="outline">Message</Button>
      <BookingModal open={isBookingOpen} onOpenChange={setIsBookingOpen} />
    </DashboardCard>
  );
}
