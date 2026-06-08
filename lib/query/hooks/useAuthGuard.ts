"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthMe } from "@/lib/query/hooks/useAuthMe";
import type { AuthMePayload } from "@/lib/query/queries";

type UseAuthGuardResult =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "onboarding" }
  | { status: "authenticated"; me: AuthMePayload };

export function useAuthGuard(): UseAuthGuardResult {
  const router = useRouter();
  const { data: me, isLoading, isError } = useAuthMe();

  useEffect(() => {
    if (isError || me === null) {
      router.replace("/login");
    }
  }, [isError, me, router]);

  if (isLoading || me === undefined) {
    return { status: "loading" };
  }

  if (me === null) {
    return { status: "unauthenticated" };
  }

  if (me.role === "student" && !me.studentId) {
    router.replace("/onboarding");
    return { status: "onboarding" };
  }

  return { status: "authenticated", me };
}
