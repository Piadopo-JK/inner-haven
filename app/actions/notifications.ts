"use server";

import { SessionRole } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";

export async function markAllNotificationsReadAction(role: SessionRole, userId: string) {
  await bookingService.markAllNotificationsRead(role, userId);

}
