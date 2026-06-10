import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/sign-up-form";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export default async function Page() {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    redirect("/dashboard");
  }

  return (
    <div className="arc-gradient flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
