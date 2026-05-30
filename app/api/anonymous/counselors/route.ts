import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("counselors")
    .select("counselor_id, name, specialization, avatar_url")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Unable to load counselors." }, { status: 500 });
  }

  return NextResponse.json({
    counselors: (data ?? []).map((row) => ({
      counselorId: row.counselor_id,
      name: row.name,
      specialization: row.specialization,
      avatarUrl: row.avatar_url,
    })),
  });
}
