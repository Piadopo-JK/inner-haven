"use client";

import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full p-2", className)}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: "w-full",
        month: "w-full space-y-3",
        caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium text-[var(--md-sys-color-on-surface)]",
        nav: "hidden",
        month_grid: "w-full table-fixed border-collapse",
        weekdays: "w-full",
        weekday:
          "h-9 text-center text-[0.8rem] font-normal text-[var(--md-sys-color-on-surface-variant)]",
        week: "w-full",
        day: "p-0 text-center text-sm align-middle",
        day_button: cn(
          "mx-auto h-9 w-9 rounded-md p-0 font-normal transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]",
        ),
        selected:
          "bg-[var(--md-sys-color-primary)] text-white hover:bg-[var(--md-sys-color-primary)] hover:text-white",
        today:
          "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]",
        outside: "text-[var(--md-sys-color-on-surface-variant)] opacity-50",
        disabled: "opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
