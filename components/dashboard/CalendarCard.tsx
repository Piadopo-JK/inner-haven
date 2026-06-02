"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { AppointmentDTO } from "@/lib/booking/contracts";
import { cn } from "@/lib/utils";

type CalendarCardProps = {
  appointments?: AppointmentDTO[];
};

export default function CalendarCard({ appointments = [] }: CalendarCardProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [month, setMonth] = React.useState<Date>(new Date());
  const [popupDate, setPopupDate] = React.useState<Date | null>(null);
  const [popupPos, setPopupPos] = React.useState<{ top: number; left: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  const bookedDates = React.useMemo(() => {
    return appointments
      .filter(a => a.status !== "cancelled" && a.status !== "expired")
      .map(a => new Date(a.appointment_date));
  }, [appointments]);

  const appointmentsForDate = React.useMemo(() => {
    if (!popupDate) return [];
    const y = popupDate.getFullYear();
    const m = String(popupDate.getMonth() + 1).padStart(2, "0");
    const d = String(popupDate.getDate()).padStart(2, "0");
    const localIso = `${y}-${m}-${d}`;
    return appointments
      .filter(a => a.appointment_date === localIso && a.status !== "cancelled")
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  }, [appointments, popupDate]);

  React.useLayoutEffect(() => {
    if (!popupDate || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const selected = containerRef.current.querySelector("[aria-selected='true']");
    if (!selected) return;
    const rect = selected.getBoundingClientRect();
    const popW = 280;
    let left = rect.left + rect.width / 2 - container.left - popW / 2;
    let top = rect.bottom - container.top + 8;
    if (left + popW > container.width - 8) left = container.width - popW - 8;
    if (left < 8) left = 8;
    setPopupPos({ top, left });
  }, [popupDate, month]);

  React.useEffect(() => {
    if (!popupDate && !date) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopupDate(null);
        setDate(undefined);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popupDate, date]);

  function handleSelect(d: Date | undefined) {
    setDate(d);
    if (d) setPopupDate(d);
  }

  return (
    <div ref={containerRef} className="relative bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
          {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            className="w-8 h-8 rounded-full"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
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
        onSelect={handleSelect}
        month={month}
        onMonthChange={(m) => { setMonth(m); setPopupDate(null); }}
        className="w-full"
        classNames={{
          month_grid: "w-full border-collapse",
          weekday: "text-[var(--md-sys-color-on-surface)] font-bold text-xs uppercase tracking-widest h-10",
          day_button: cn(
            "mx-auto h-7 w-7 rounded-lg transition-all font-medium text-[var(--md-sys-color-on-surface)] bg-transparent",
            "hover:bg-[var(--md-sys-color-surface-container)]",
            "[.day-today_&]:bg-[var(--md-sys-color-primary-container)] [.day-today_&]:text-[var(--md-sys-color-on-primary-container)] [.day-today_&]:font-bold",
            "[.day-selected_&]:bg-[var(--md-sys-color-primary)] [.day-selected_&]:text-[var(--md-sys-color-on-primary)]",
            "[.day-selected_&]:hover:bg-[var(--md-sys-color-primary)] [.day-selected_&]:hover:text-[var(--md-sys-color-on-primary)]",
          ),
          selected: "day-selected",
          today: "day-today",
          outside: "text-[var(--md-sys-color-on-surface-variant)] opacity-60",
        }}
        modifiers={{
          booked: bookedDates
        }}
        modifiersClassNames={{
          booked: "relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:block after:w-1 after:h-1 after:bg-[var(--md-sys-color-primary)] after:rounded-full"
        }}
      />

      {popupDate && popupPos && (
        <div
          ref={popupRef}
          className="absolute w-[280px] max-h-80 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-4 shadow-lg overflow-y-auto z-50"
          style={{ top: popupPos.top, left: popupPos.left }}
        >
          <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-3">
            {popupDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          {appointmentsForDate.length === 0 ? (
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">No appointments</p>
          ) : (
            <div className="flex flex-col gap-2">
              {appointmentsForDate.map(a => (
                <div
                  key={a.appointment_id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{
                    background: a.status === "approved"
                      ? "var(--md-sys-color-primary-container)"
                      : a.status === "completed"
                      ? "var(--md-sys-color-secondary-container)"
                      : "var(--md-sys-color-tertiary-container)",
                  }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: a.status === "approved"
                        ? "var(--md-sys-color-on-primary-container)"
                        : a.status === "completed"
                        ? "var(--md-sys-color-on-secondary-container)"
                        : "var(--md-sys-color-on-tertiary-container)",
                    }}
                  >
                    {a.appointment_time.slice(0, 5)}
                  </span>
                  <span className="flex-1 text-xs truncate" style={{ color: "var(--md-sys-color-on-surface)" }}>
                    {a.reason_preview || a.reason}
                  </span>
                  <span
                    className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded-full"
                    style={{
                      background: a.mode === "online"
                        ? "var(--md-sys-color-secondary-container)"
                        : "var(--md-sys-color-surface-container-high)",
                      color: a.mode === "online"
                        ? "var(--md-sys-color-on-secondary-container)"
                        : "var(--md-sys-color-on-surface-variant)",
                    }}
                  >
                    {a.mode === "online" ? "Online" : "In-person"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
