"use client";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/lib/query/hooks/useSignOut";

export function LogoutButton() {
  const signOut = useSignOut();

  const logout = async () => {
    await signOut();
  };

  return <Button variant="destructive" onClick={logout}>Logout</Button>;
}
