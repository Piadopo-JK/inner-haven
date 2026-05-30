import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { getSessionUser } from "@/lib/supabase/get-session-user";
import { bookingService } from "@/lib/booking/service";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  if (sessionUser.role === "counselor") {
    redirect("/dashboard");
  }

  const studentId = await bookingService.resolveStudentId(sessionUser.userId);
  if (studentId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 ease-out flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <div className="p-3 bg-primary/10 rounded-2xl shadow-sm ring-1 ring-primary/10">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to GuidanceGO
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s get your profile set up so you can start booking appointments.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
