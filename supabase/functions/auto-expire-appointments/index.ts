// ============================================================================
// Supabase Edge Function: auto-expire-appointments
// ============================================================================
// Runs on a cron schedule to proactively expire past-due appointments.
//
// Behavior:
//   pending appointments past date+time  → status = 'expired'
//   approved/rescheduled past date+time  → status = 'completed'
//
// Deployment:
//   supabase functions deploy auto-expire-appointments
//
// Cron schedule (configure in supabase/config.toml):
//   [functions.auto-expire-appointments]
//   schedule = "*/5 * * * *"   # every 5 minutes
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (_req) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const nowTime = now.toTimeString().slice(0, 5); // HH:MM

  try {
    // Fetch appointments that are past-due but not yet in a terminal state.
    // We check: (date < today) OR (date = today AND time < now)
    const { data: rows, error } = await supabase
      .from("appointments")
      .select("appointment_id, appointment_date, appointment_time, status")
      .in("status", ["pending", "approved", "rescheduled"])
      .or(
        `appointment_date.lt.${today},and(appointment_date.eq.${today},appointment_time.lt.${nowTime})`,
      );

    if (error) {
      console.error("Failed to fetch past-due appointments:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ expired: 0, completed: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pendingIds: string[] = [];
    const approvedIds: string[] = [];

    for (const row of rows) {
      const dateTime = `${row.appointment_date}T${row.appointment_time}`;
      const appointmentMs = Date.parse(dateTime);
      if (Number.isNaN(appointmentMs) || appointmentMs >= now.getTime()) {
        continue; // not actually past-due (timezone edge case)
      }
      if (row.status === "pending") {
        pendingIds.push(row.appointment_id);
      } else {
        approvedIds.push(row.appointment_id);
      }
    }

    const results = { expired: 0, completed: 0 };

    if (pendingIds.length > 0) {
      const { error: expireError } = await supabase
        .from("appointments")
        .update({ status: "expired", updated_at: now.toISOString() })
        .in("appointment_id", pendingIds);

      if (expireError) {
        console.error("Failed to expire appointments:", expireError);
      } else {
        results.expired = pendingIds.length;
      }
    }

    if (approvedIds.length > 0) {
      const { error: completeError } = await supabase
        .from("appointments")
        .update({ status: "completed", updated_at: now.toISOString() })
        .in("appointment_id", approvedIds);

      if (completeError) {
        console.error("Failed to complete appointments:", completeError);
      } else {
        results.completed = approvedIds.length;
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
