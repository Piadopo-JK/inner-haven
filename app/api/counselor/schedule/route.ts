import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  CounselorScheduleRuleInputDTO,
} from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function validateRules(input: unknown): input is CounselorScheduleRuleInputDTO[] {
  if (!Array.isArray(input)) {
    return false;
  }

  return input.every((rule) => {
    if (!rule || typeof rule !== "object") return false;

    const candidate = rule as CounselorScheduleRuleInputDTO;

    if (!Number.isInteger(candidate.day_of_week) || candidate.day_of_week < 0 || candidate.day_of_week > 6) {
      return false;
    }

    if (!isValidTime(candidate.start_time) || !isValidTime(candidate.end_time)) {
      return false;
    }

    if (toMinutes(candidate.start_time) >= toMinutes(candidate.end_time)) {
      return false;
    }

    if (!Number.isInteger(candidate.slot_duration_minutes)) {
      return false;
    }

    if (candidate.slot_duration_minutes < 15 || candidate.slot_duration_minutes > 180) {
      return false;
    }

    if (!Array.isArray(candidate.breaks)) {
      return true;
    }

    return candidate.breaks.every((breakRange) => {
      if (!breakRange || typeof breakRange !== "object") return false;
      if (!isValidTime(breakRange.start_time) || !isValidTime(breakRange.end_time)) {
        return false;
      }

      const breakStart = toMinutes(breakRange.start_time);
      const breakEnd = toMinutes(breakRange.end_time);
      const start = toMinutes(candidate.start_time);
      const end = toMinutes(candidate.end_time);

      if (breakStart >= breakEnd) {
        return false;
      }

      return breakStart >= start && breakEnd <= end;
    });
  });
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "counselor") {
      return NextResponse.json({ error: "Only counselors can manage schedules" }, { status: 403 });
    }

    const counselorId = await bookingService.resolveCounselorId(sessionUser.userId);
    if (!counselorId) {
      return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
    }

    const rules = await bookingService.getCounselorSchedule(counselorId);
    return NextResponse.json(rules);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "counselor") {
      return NextResponse.json({ error: "Only counselors can manage schedules" }, { status: 403 });
    }

    const body = (await request.json()) as { rules?: unknown };
    const rulesInput = body.rules ?? [];

    if (!validateRules(rulesInput)) {
      return NextResponse.json({ error: "Invalid schedule rules payload" }, { status: 400 });
    }

    const counselorId = await bookingService.resolveCounselorId(sessionUser.userId);
    if (!counselorId) {
      return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
    }

    await bookingService.upsertCounselorSchedule(counselorId, rulesInput);
    revalidatePath("/app/dashboard");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Failed to save schedule";
    const hint =
      rawMessage.includes("start_time") ||
      rawMessage.includes("slot_duration_minutes") ||
      rawMessage.includes("breaks")
        ? " Missing availability rule columns."
        : "";

    return NextResponse.json({ error: `${rawMessage}${hint}`.trim() }, { status: 500 });
  }
}
