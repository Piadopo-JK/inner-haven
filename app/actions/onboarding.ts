"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setupStudentProfile(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const course = formData.get("course") as string | null; // Optional
  
  if (!name || name.trim() === "") {
    return { error: "Name is required" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to set up your profile." };
  }

  // Insert into students table
  const { error } = await supabase
    .from("students")
    .insert({
      auth_user_id: user.id,
      name: name.trim(),
      email: user.email,
    });

  if (error) {
    // If it's a unique constraint violation (user already exists), that's fine, we can just proceed.
    if (error.code !== "23505") {
      console.error("Error setting up profile:", error);
      return { error: "Failed to create profile. Please try again." };
    }
  }

  // We are successful! Revalidate dashboard and redirect
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
