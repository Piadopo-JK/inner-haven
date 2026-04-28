import { getSessionUser } from "@/lib/supabase/get-session-user";
import GlobalCacheWarmerClient from "./GlobalCacheWarmer";

export default async function CacheWarmerInitializer() {
  const user = await getSessionUser();
  if (!user) return null;

  return <GlobalCacheWarmerClient role={user.role} userId={user.userId} />;
}
