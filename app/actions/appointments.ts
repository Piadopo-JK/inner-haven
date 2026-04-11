"use server";

import { revalidatePath } from "next/cache";

import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";


//Server Action — update appointment status.
export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: "approved" | "cancelled",
): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "counselor") {
    throw new Error("Unauthorized");
  }

  const ownAppointments = await bookingService.listAppointments({
    role: "counselor",
    counselor_id: sessionUser.userId,
  });
  const owns = ownAppointments.some((a) => a.appointment_id === appointmentId);
  if (!owns) {
    throw new Error("Forbidden");
  }

  await bookingService.updateAppointmentStatus(appointmentId, status);
  revalidatePath("/dashboard");
}
