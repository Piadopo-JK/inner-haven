"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Md3Message } from "@/components/ui/md3-message";
import { CounselorScheduleRuleDTO } from "@/lib/booking/contracts";
import {
  emitCounselorScheduleChanged,
  getCounselorScheduleCached,
  isCounselorScheduleCacheFresh,
  subscribeCounselorScheduleChanged,
  subscribeVisibilityRefetch,
  subscribeNetworkRefetch,
} from "@/lib/cache/settings-client-cache";

type DayScheduleState = {
  day_of_week: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start_time: string;
  break_end_time: string;
};

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function defaultDaySchedule(day_of_week: number): DayScheduleState {
  return {
    day_of_week,
    is_active: day_of_week >= 1 && day_of_week <= 5,
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: 60,
    break_start_time: "12:00",
    break_end_time: "13:00",
  };
}

function toStateMap(rules: CounselorScheduleRuleDTO[]) {
  const base = new Map<number, DayScheduleState>();
  for (let day = 0; day < 7; day += 1) {
    base.set(day, defaultDaySchedule(day));
  }

  for (const rule of rules) {
    const firstBreak = rule.breaks?.[0];
    base.set(rule.day_of_week, {
      day_of_week: rule.day_of_week,
      is_active: rule.is_active,
      start_time: rule.start_time,
      end_time: rule.end_time,
      slot_duration_minutes: rule.slot_duration_minutes,
      break_start_time: firstBreak?.start_time ?? "",
      break_end_time: firstBreak?.end_time ?? "",
    });
  }

  return Array.from(base.values()).sort((a, b) => a.day_of_week - b.day_of_week);
}

export default function CounselorScheduleSettingsCard() {
  const [days, setDays] = React.useState<DayScheduleState[]>(() =>
    Array.from({ length: 7 }, (_, index) => defaultDaySchedule(index)),
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadSchedule(force = false) {
      setIsLoading(true);
      setError(null);

      try {
        const payload = await getCounselorScheduleCached({ force });
        setDays(toStateMap(payload));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load schedule settings.");
      } finally {
        setIsLoading(false);
      }
    }

    const unsubscribe = subscribeCounselorScheduleChanged(() => {
      void loadSchedule();
    });
    const unsubscribeVisibility = subscribeVisibilityRefetch(isCounselorScheduleCacheFresh, () =>
      void loadSchedule(),
    );
    const unsubscribeNetwork = subscribeNetworkRefetch(isCounselorScheduleCacheFresh, () =>
      void loadSchedule(),
    );

    void loadSchedule();
    return () => {
      unsubscribe();
      unsubscribeVisibility();
      unsubscribeNetwork();
    };
  }, []);

  function updateDay(day_of_week: number, patch: Partial<DayScheduleState>) {
    setDays((prev) =>
      prev.map((day) => (day.day_of_week === day_of_week ? { ...day, ...patch } : day)),
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const rules = days
      .filter((day) => day.is_active)
      .map((day) => ({
        day_of_week: day.day_of_week,
        is_active: true,
        start_time: day.start_time,
        end_time: day.end_time,
        slot_duration_minutes: Number(day.slot_duration_minutes),
        breaks:
          day.break_start_time && day.break_end_time
            ? [
                {
                  start_time: day.break_start_time,
                  end_time: day.break_end_time,
                },
              ]
            : [],
      }));

    try {
      const response = await fetch("/api/counselor/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Unable to save schedule settings.");
      }

      emitCounselorScheduleChanged(
        rules.map((rule) => ({
          day_of_week: rule.day_of_week,
          is_active: rule.is_active,
          start_time: rule.start_time,
          end_time: rule.end_time,
          slot_duration_minutes: rule.slot_duration_minutes,
          breaks: rule.breaks,
        })),
      );
      setSuccess("Schedule saved. Booking slots will update immediately.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save schedule settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section id="schedule-settings" className="rounded-xl border p-5" style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
      <h2 className="text-base font-semibold">Booking Schedule</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Define your recurring weekly schedule, slot duration, and one optional break window.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading schedule...</p>
      ) : (
        <div className="mt-4 grid gap-4">
          {days.map((day) => (
            <article
              key={day.day_of_week}
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--md-sys-color-outline-variant)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{dayLabels[day.day_of_week]}</p>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={day.is_active}
                    onChange={(event) => updateDay(day.day_of_week, { is_active: event.target.checked })}
                  />
                  Enabled
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-sm">
                  Start
                  <Input
                    type="time"
                    value={day.start_time}
                    onChange={(event) => updateDay(day.day_of_week, { start_time: event.target.value })}
                    disabled={!day.is_active}
                  />
                </label>
                <label className="text-sm">
                  End
                  <Input
                    type="time"
                    value={day.end_time}
                    onChange={(event) => updateDay(day.day_of_week, { end_time: event.target.value })}
                    disabled={!day.is_active}
                  />
                </label>
                <label className="text-sm">
                  Slot Minutes
                  <Input
                    type="number"
                    min={15}
                    max={180}
                    step={5}
                    value={day.slot_duration_minutes}
                    onChange={(event) =>
                      updateDay(day.day_of_week, { slot_duration_minutes: Number(event.target.value) || 60 })
                    }
                    disabled={!day.is_active}
                  />
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  Break Start (optional)
                  <Input
                    type="time"
                    value={day.break_start_time}
                    onChange={(event) => updateDay(day.day_of_week, { break_start_time: event.target.value })}
                    disabled={!day.is_active}
                  />
                </label>
                <label className="text-sm">
                  Break End (optional)
                  <Input
                    type="time"
                    value={day.break_end_time}
                    onChange={(event) => updateDay(day.day_of_week, { break_end_time: event.target.value })}
                    disabled={!day.is_active}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? "Saving..." : "Save Schedule"}
        </Button>
        {error ? <Md3Message tone="error">{error}</Md3Message> : null}
        {success ? <Md3Message tone="success">{success}</Md3Message> : null}
      </div>
    </section>
  );
}
