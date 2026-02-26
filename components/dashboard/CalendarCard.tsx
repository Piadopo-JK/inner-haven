"use client";

import * as React from "react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Calendar } from "@/components/ui/calendar";

export default function CalendarCard() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  return (
    <DashboardCard title="Calendar">
      <div className="w-full">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-full rounded-md border p-2"
        />
      </div>
    </DashboardCard>
  );
}
