"use server";

import { revalidatePath } from "next/cache";

import { bookingService } from "@/lib/booking/service";

//Server Action — update appointment status.
export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: "approved" | "cancelled",
): Promise<void> {
  await bookingService.updateAppointmentStatus(appointmentId, status);
  revalidatePath("/dashboard");
}
