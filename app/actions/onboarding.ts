"use server";

import { bookingService } from "@/lib/booking/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setupStudentProfile(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;

  if (!name || name.trim() === "") {
    return { error: "Name is required" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to set up your profile." };
  }

  try {
    await bookingService.ensureStudentProfile({
      authUserId: user.id,
      email: user.email,
      name: name.trim(),
    });
  } catch (e) {
    console.error("Error setting up profile:", e);
    return { error: "Failed to create profile. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
