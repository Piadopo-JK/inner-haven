"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { AppointmentDTO } from "@/lib/booking/contracts";

type CalendarCardProps = {
  appointments?: AppointmentDTO[];
};

export default function CalendarCard({ appointments = [] }: CalendarCardProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [month, setMonth] = React.useState<Date>(new Date());

  const bookedDates = React.useMemo(() => {
    return appointments.map(a => new Date(a.appointment_date));
  }, [appointments]);

  return (
    <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
          {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        month={month}
        onMonthChange={setMonth}
        className="w-full"
        classNames={{
          month_grid: "w-full border-collapse",
          weekday: "text-[var(--md-sys-color-on-surface-variant)] font-bold text-xs uppercase tracking-widest h-10",
          day_button: "h-10 w-10 rounded-full transition-all font-medium",
          selected: "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)]",
          today: "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold",
        }}
        modifiers={{
          booked: bookedDates
        }}
        modifiersClassNames={{
          booked: "after:block after:w-1 after:h-1 after:bg-[var(--md-sys-color-primary)] after:rounded-full after:mx-auto after:mt-1"
        }}
      />
    </div>
  );
}
