"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Md3Message } from "@/components/ui/md3-message";
import { CounselorScheduleRuleDTO } from "@/lib/booking/contracts";
import {
  useCounselorSchedule,
  useSaveCounselorSchedule,
} from "@/lib/query/hooks/useCounselorSchedule";

type DayScheduleState = {
  day_of_week: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  has_break: boolean;
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
    has_break: day_of_week >= 1 && day_of_week <= 5,
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
    const hasBreak = Boolean(firstBreak?.start_time && firstBreak?.end_time);
    base.set(rule.day_of_week, {
      day_of_week: rule.day_of_week,
      is_active: rule.is_active,
      start_time: rule.start_time,
      end_time: rule.end_time,
      slot_duration_minutes: rule.slot_duration_minutes,
      has_break: hasBreak,
      break_start_time: firstBreak?.start_time ?? "12:00",
      break_end_time: firstBreak?.end_time ?? "13:00",
    });
  }
  return Array.from(base.values()).sort((a, b) => a.day_of_week - b.day_of_week);
}

export default function CounselorScheduleSettingsCard() {
  const { data: scheduleRules, isLoading, error: loadError } = useCounselorSchedule();
  const { mutateAsync: saveCounselorSchedule, isPending: isSaving } = useSaveCounselorSchedule();

  const [days, setDays] = React.useState<DayScheduleState[]>(() =>
    Array.from({ length: 7 }, (_, i) => defaultDaySchedule(i)),
  );
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (scheduleRules) setDays(toStateMap(scheduleRules));
  }, [scheduleRules]);

  function updateDay(day_of_week: number, patch: Partial<DayScheduleState>) {
    setDays((prev) =>
      prev.map((d) => (d.day_of_week === day_of_week ? { ...d, ...patch } : d)),
    );
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);

    const rules = days
      .filter((d) => d.is_active)
      .map((d) => ({
        day_of_week: d.day_of_week,
        is_active: true as const,
        start_time: d.start_time,
        end_time: d.end_time,
        slot_duration_minutes: Number(d.slot_duration_minutes),
        breaks:
          d.has_break && d.break_start_time && d.break_end_time
            ? [{ start_time: d.break_start_time, end_time: d.break_end_time }]
            : [],
      }));

    try {
      await saveCounselorSchedule(rules);
      setSuccess("Schedule saved. Booking slots will update immediately.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save schedule settings.");
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
      ) : loadError ? (
        <Md3Message tone="error" className="mt-4">
          {loadError instanceof Error ? loadError.message : "Unable to load schedule settings."}
        </Md3Message>
      ) : (
        <div className="mt-4 grid gap-4">
          {days.map((day) => (
            <article key={day.day_of_week} className="rounded-lg border p-4" style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{dayLabels[day.day_of_week]}</p>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={day.is_active}
                    onChange={(e) => updateDay(day.day_of_week, { is_active: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-sm">
                  Start
                  <Input type="time" value={day.start_time} onChange={(e) => updateDay(day.day_of_week, { start_time: e.target.value })} disabled={!day.is_active} />
                </label>
                <label className="text-sm">
                  End
                  <Input type="time" value={day.end_time} onChange={(e) => updateDay(day.day_of_week, { end_time: e.target.value })} disabled={!day.is_active} />
                </label>
                <label className="text-sm">
                  Slot Minutes
                  <Input type="number" min={15} max={180} step={5} value={day.slot_duration_minutes} onChange={(e) => updateDay(day.day_of_week, { slot_duration_minutes: Number(e.target.value) || 60 })} disabled={!day.is_active} />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={day.has_break}
                    onChange={(e) => updateDay(day.day_of_week, { has_break: e.target.checked })}
                    disabled={!day.is_active}
                  />
                  Include break window
                </label>
              </div>
              {day.has_break && (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    Break Start
                    <Input type="time" value={day.break_start_time} onChange={(e) => updateDay(day.day_of_week, { break_start_time: e.target.value })} disabled={!day.is_active} />
                  </label>
                  <label className="text-sm">
                    Break End
                    <Input type="time" value={day.break_end_time} onChange={(e) => updateDay(day.day_of_week, { break_end_time: e.target.value })} disabled={!day.is_active} />
                  </label>
                </div>
              )}
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
