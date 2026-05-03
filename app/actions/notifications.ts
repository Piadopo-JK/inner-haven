"use server";

import { revalidatePath } from "next/cache";

import { SessionRole } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";

export async function markAllNotificationsReadAction(role: SessionRole, userId: string) {
  await bookingService.markAllNotificationsRead(role, userId);
  revalidatePath("/", "layout");
}
