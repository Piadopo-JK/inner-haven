"use client";

import { useState } from "react";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Calendar as CalendarIcon,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import type { AppointmentStatus } from "@/lib/booking/contracts";

export type SortOrder = "asc" | "desc";

export interface AppointmentFiltersState {
  sortOrder: SortOrder;
  dateFrom: string;
  dateTo: string;
  statuses: AppointmentStatus[];
}

const COMPLETED_TAB_STATUSES: AppointmentStatus[] = [
  "completed",
  "cancelled",
  "expired",
];

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const DEFAULT_FILTERS: AppointmentFiltersState = {
  sortOrder: "desc",
  dateFrom: "",
  dateTo: "",
  statuses: [...COMPLETED_TAB_STATUSES],
};

interface AppointmentFiltersProps {
  filters: AppointmentFiltersState;
  onChange: (filters: AppointmentFiltersState) => void;
}

export default function AppointmentFilters({
  filters,
  onChange,
}: AppointmentFiltersProps) {
  const [open, setOpen] = useState(false);
  const [calendarPopup, setCalendarPopup] = useState<"from" | "to" | null>(null);

  function setDateFrom(value: string) {
    onChange({ ...filters, dateFrom: value });
    setCalendarPopup(null);
  }

  function setDateTo(value: string) {
    onChange({ ...filters, dateTo: value });
    setCalendarPopup(null);
  }

  function toggleStatus(status: AppointmentStatus) {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  }

  function toggleSortOrder() {
    onChange({
      ...filters,
      sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
    });
  }

  function clearAll() {
    onChange({ ...DEFAULT_FILTERS });
  }

  const hasActiveFilters =
    filters.sortOrder !== DEFAULT_FILTERS.sortOrder ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.statuses.length !== COMPLETED_TAB_STATUSES.length ||
    !COMPLETED_TAB_STATUSES.every((s) => filters.statuses.includes(s));

  const activeFilterCount = [
    filters.sortOrder !== DEFAULT_FILTERS.sortOrder ? 1 : 0,
    filters.dateFrom || filters.dateTo ? 1 : 0,
    filters.statuses.length !== COMPLETED_TAB_STATUSES.length ||
    !COMPLETED_TAB_STATUSES.every((s) => filters.statuses.includes(s))
      ? 1
      : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="relative">
      <Button
        variant={hasActiveFilters ? "default" : "outline"}
        size="sm"
        onClick={() => setOpen(!open)}
        className={`gap-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
          hasActiveFilters
            ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
            : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--md-sys-color-on-primary)] text-[var(--md-sys-color-primary)] text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-2 z-50 w-[22rem] rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-5 shadow-[var(--md-sys-elevation-level3)]"
          >
            {/* Sort Order */}
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-3">
                Sort Order
              </p>
              <button
                onClick={toggleSortOrder}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-sm font-semibold text-[var(--md-sys-color-on-surface)] transition-all hover:bg-[var(--md-sys-color-surface-container-highest)] active:scale-[0.98]"
              >
                {filters.sortOrder === "desc" ? (
                  <>
                    <ArrowDownNarrowWide className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                    <span>Newest First</span>
                  </>
                ) : (
                  <>
                    <ArrowUpNarrowWide className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                    <span>Oldest First</span>
                  </>
                )}
              </button>
            </div>

            {/* Date Range */}
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-3">
                <CalendarIcon className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
                Date Range
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    From
                  </label>
                  <button
                    type="button"
                    onClick={() => setCalendarPopup(calendarPopup === "from" ? null : "from")}
                    className={`w-full rounded-lg border px-2 py-2 text-sm text-left transition-colors ${
                      filters.dateFrom
                        ? "text-[var(--md-sys-color-on-surface)]"
                        : "text-[var(--md-sys-color-on-surface-variant)]"
                    }`}
                    style={{
                      borderColor: calendarPopup === "from" ? "var(--md-sys-color-primary)" : "var(--md-sys-color-outline-variant)",
                      background: "var(--md-sys-color-surface-container-lowest)",
                    }}
                  >
                    {filters.dateFrom
                      ? new Date(filters.dateFrom + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Pick date"}
                  </button>
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    To
                  </label>
                  <button
                    type="button"
                    onClick={() => setCalendarPopup(calendarPopup === "to" ? null : "to")}
                    className={`w-full rounded-lg border px-2 py-2 text-sm text-left transition-colors ${
                      filters.dateTo
                        ? "text-[var(--md-sys-color-on-surface)]"
                        : "text-[var(--md-sys-color-on-surface-variant)]"
                    }`}
                    style={{
                      borderColor: calendarPopup === "to" ? "var(--md-sys-color-primary)" : "var(--md-sys-color-outline-variant)",
                      background: "var(--md-sys-color-surface-container-lowest)",
                    }}
                  >
                    {filters.dateTo
                      ? new Date(filters.dateTo + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Pick date"}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Filters */}
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-3">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {COMPLETED_TAB_STATUSES.map((status) => {
                  const isActive = filters.statuses.includes(status);
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                        isActive
                          ? status === "completed"
                            ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] ring-2 ring-[var(--md-sys-color-secondary)]"
                            : status === "cancelled"
                              ? "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] ring-2 ring-[var(--md-sys-color-error)]"
                              : "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] ring-2 ring-[var(--md-sys-color-outline)]"
                          : "bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface-variant)] opacity-60 hover:opacity-100"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--md-sys-color-error)] hover:text-[var(--md-sys-color-on-error-container)] hover:underline transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                className="rounded-xl"
              >
                Apply
              </Button>
            </div>
          </div>
        </>
      )}

      {calendarPopup && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setCalendarPopup(null)}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setCalendarPopup(null); }}
          >
            <div
              className="w-full max-w-xs rounded-2xl border p-5 shadow-xl"
              style={{
                borderColor: "var(--md-sys-color-outline-variant)",
                background: "var(--md-sys-color-surface-container-high)",
              }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--md-sys-color-on-surface)" }}>
                {calendarPopup === "from" ? "From Date" : "To Date"}
              </p>
              <Calendar
                mode="single"
                selected={
                  (calendarPopup === "from" ? filters.dateFrom : filters.dateTo)
                    ? new Date((calendarPopup === "from" ? filters.dateFrom : filters.dateTo) + "T00:00:00")
                    : undefined
                }
                onSelect={(day) => {
                  if (day) {
                    const y = day.getFullYear();
                    const m = String(day.getMonth() + 1).padStart(2, "0");
                    const d = String(day.getDate()).padStart(2, "0");
                    const val = `${y}-${m}-${d}`;
                    if (calendarPopup === "from") setDateFrom(val);
                    else setDateTo(val);
                  }
                }}
              />
              <div className="flex items-center justify-center gap-3 mt-3">
                {(calendarPopup === "from" ? filters.dateFrom : filters.dateTo) ? (
                  <button
                    onClick={() => {
                      if (calendarPopup === "from") onChange({ ...filters, dateFrom: "" });
                      else onChange({ ...filters, dateTo: "" });
                      setCalendarPopup(null);
                    }}
                    className="text-xs font-medium text-[var(--md-sys-color-error)] hover:underline"
                  >
                    Clear
                  </button>
                ) : <span />}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCalendarPopup(null)}
                  className="rounded-xl"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
