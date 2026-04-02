"use client";

import * as React from "react";
import Link from "next/link";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CounselorDirectoryItemDTO } from "@/lib/booking/contracts";
import { createClient } from "@/lib/supabase/client";

type AvailableCounselorsListProps = {
  counselors: CounselorDirectoryItemDTO[];
};

type AvailabilitySlot = {
  appointment_time: string;
  available: boolean;
};

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${minuteStr} ${suffix}`;
}

export default function AvailableCounselorsList({ counselors }: AvailableCounselorsListProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [availabilityByCounselor, setAvailabilityByCounselor] = React.useState<Record<string, string[]>>({});

  const filteredCounselors = React.useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return counselors;

    return counselors.filter((counselor) => {
      return (
        counselor.name.toLowerCase().includes(keyword) ||
        counselor.email.toLowerCase().includes(keyword) ||
        counselor.specialization.toLowerCase().includes(keyword)
      );
    });
  }, [counselors, searchTerm]);

  const refreshAvailability = React.useCallback(async () => {
    if (!selectedDate || counselors.length === 0) {
      setAvailabilityByCounselor({});
      return;
    }

    const date = formatDateOnly(selectedDate);

    setLoading(true);
    setError("");

    try {
      const results = await Promise.all(
        counselors.map(async (counselor) => {
          const response = await fetch(
            `/api/availability?counselor_id=${counselor.counselor_id}&date=${date}`,
            { cache: "no-store" },
          );

          if (!response.ok) {
            throw new Error("Failed to load counselor availability");
          }

          const slots = (await response.json()) as AvailabilitySlot[];
          const availableTimes = slots
            .filter((slot) => slot.available)
            .map((slot) => slot.appointment_time);

          return { counselorId: counselor.counselor_id, availableTimes };
        }),
      );

      const nextState: Record<string, string[]> = {};
      for (const item of results) {
        nextState[item.counselorId] = item.availableTimes;
      }
      setAvailabilityByCounselor(nextState);
    } catch {
      setAvailabilityByCounselor({});
      setError("Could not load availability for the selected date.");
    } finally {
      setLoading(false);
    }
  }, [counselors, selectedDate]);

  React.useEffect(() => {
    void refreshAvailability();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshAvailability();
      }
    }

    function handleFocus() {
      void refreshAvailability();
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAvailability]);

  React.useEffect(() => {
    const supabase = createClient();
    const fallbackInterval = window.setInterval(() => {
      void refreshAvailability();
    }, 15000);

    const channel = supabase
      .channel("appointments-realtime-counselors")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          void refreshAvailability();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          window.clearInterval(fallbackInterval);
        }
      });

    return () => {
      window.clearInterval(fallbackInterval);
      void supabase.removeChannel(channel);
    };
  }, [refreshAvailability]);

  return (
    <div className="grid gap-5">
      <div className="rounded-md border p-3" style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
        <p
          className="mb-2 text-sm font-medium"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          Choose a date to view counselor timeslots
        </p>
        <Calendar
          mode="single"
          month={currentMonth}
          selected={selectedDate}
          onSelect={(date) => setSelectedDate(date ?? undefined)}
          onMonthChange={(month) => setCurrentMonth(month)}
          className="w-full rounded-md border"
        />
      </div>

      {error ? (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {error}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label
          htmlFor="counselor-search"
          className="text-sm font-medium"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          Search counselor
        </label>
        <Input
          id="counselor-search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name, email, or specialization"
        />
      </div>

      <div className="grid gap-3">
        {counselors.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            No counselors found.
          </p>
        ) : null}

        {counselors.length > 0 && filteredCounselors.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            No counselor matches your search.
          </p>
        ) : null}

        {filteredCounselors.map((counselor) => {
          const selectedDateValue = selectedDate ? formatDateOnly(selectedDate) : "";
          const availableTimes = availabilityByCounselor[counselor.counselor_id] ?? [];

          return (
            <article
              key={counselor.counselor_id}
              className="rounded-lg border p-4"
              style={{
                borderColor: "var(--md-sys-color-outline-variant)",
                background: "var(--md-sys-color-surface-container-low)",
              }}
            >
              <div className="grid gap-1">
                <h3 className="text-base font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
                  {counselor.name}
                </h3>
                <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  {counselor.specialization}
                </p>
                <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  {counselor.email}
                </p>
                <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  Room: {counselor.office_room}
                </p>
              </div>

              <div className="mt-3 grid gap-2">
                <p className="text-xs font-medium" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  Available timeslots {selectedDateValue ? `for ${selectedDateValue}` : ""}
                </p>

                {loading && selectedDate ? (
                  <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Loading availability...
                  </p>
                ) : availableTimes.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    No available slots on this date.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTimes.map((time) => (
                      <Link
                        key={time}
                        href={`/appointments/new?date=${selectedDateValue}&time=${time}&counselor_id=${counselor.counselor_id}`}
                      >
                        <Button type="button" variant="outline" size="sm">
                          {formatTime(time)}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
