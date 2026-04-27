import { NextRequest, NextResponse } from "next/server";

import { bookingService } from "@/lib/booking/service";
import { AvailabilityWindowResponseDTO } from "@/lib/booking/contracts";
import { getSessionUser } from "@/lib/supabase/get-session-user";

const MAX_RANGE_DAYS = 42;

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, yearRaw, monthRaw, dayRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(utc.getTime()) ||
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }

  return utc;
}

function formatIsoDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daySpanInclusive(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counselorId = request.nextUrl.searchParams.get("counselor_id");
  const date = request.nextUrl.searchParams.get("date");
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!counselorId) {
    return NextResponse.json(
      { error: "Missing counselor_id" },
      { status: 400 },
    );
  }

  if (sessionUser.role === "counselor") {
    const ownCounselorId = await bookingService.resolveCounselorId(sessionUser.userId);
    if (!ownCounselorId || ownCounselorId !== counselorId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }
  }

  if (date) {
    const availability = await bookingService.getAvailability(counselorId, date);
    return NextResponse.json(availability);
  }

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing date, or from/to range" },
      { status: 400 },
    );
  }

  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);

  if (!fromDate || !toDate || toDate.getTime() < fromDate.getTime()) {
    return NextResponse.json(
      { error: "Invalid from/to range" },
      { status: 400 },
    );
  }

  const span = daySpanInclusive(fromDate, toDate);
  if (span > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `Range too large. Max ${MAX_RANGE_DAYS} days.` },
      { status: 400 },
    );
  }

  const responses = await bookingService.getAvailabilityRange(counselorId, from, to);

  const payload: AvailabilityWindowResponseDTO = {
    counselor_id: counselorId,
    from,
    to,
    by_date: responses,
  };

  return NextResponse.json(payload);
}
