import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint is no longer available." },
    { status: 410 },
  );
}
