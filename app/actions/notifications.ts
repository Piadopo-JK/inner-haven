"use server";

import { revalidatePath } from "next/cache";

import { bookingService } from "@/lib/booking/service";

export async function markNotificationReadAction(notificationId: string) {
  await bookingService.markNotificationRead(notificationId);
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
