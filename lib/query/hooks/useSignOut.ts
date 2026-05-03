"use client";

import { useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export function useSignOut() {
  const queryClient = useQueryClient();

  return async function signOut(redirectTo = "/auth/login") {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    queryClient.clear();
    window.location.assign(redirectTo);
  };
}