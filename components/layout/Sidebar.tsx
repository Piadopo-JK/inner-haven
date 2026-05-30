import SidebarClient from "@/components/layout/SidebarClient";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export default async function Sidebar() {
  const sessionUser = await getSessionUser();

  return <SidebarClient isVisible={!!sessionUser} role={sessionUser?.role} />;
}
