import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { getCounselorsCached } from "@/lib/cache/appointments-cache";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingStats from "@/components/landing/LandingStats";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCounselorShowcase from "@/components/landing/LandingCounselorShowcase";
import LandingFeatureGrid from "@/components/landing/LandingFeatureGrid";

export default async function Home() {
  const sessionUser = await getSessionUser();
  if (sessionUser) redirect("/dashboard");

  const counselors = await getCounselorsCached();

  return (
    <div className="min-h-dvh arc-gradient">
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingHowItWorks />
      <LandingCounselorShowcase counselors={counselors} />
      <LandingFeatureGrid />
    </div>
  );
}
