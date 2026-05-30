import { redirect } from "next/navigation";

import { bookingService } from "@/lib/booking/service";

export async function requireStudentProfile(authUserId: string): Promise<void> {
  const studentId = await bookingService.resolveStudentId(authUserId);
  if (!studentId) {
    redirect("/onboarding");
  }
}
