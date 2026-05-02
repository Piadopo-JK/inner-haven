import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { isAuthExpiredError } from "@/lib/query/http";

let authExpiryRedirectInFlight = false;

async function handleAuthExpired(queryClient: QueryClient, error: unknown) {
  if (
    typeof window === "undefined" ||
    !isAuthExpiredError(error) ||
    authExpiryRedirectInFlight
  ) {
    return;
  }

  authExpiryRedirectInFlight = true;
  queryClient.clear();

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut().catch(() => undefined);
  } finally {
    window.location.assign("/auth/login?reason=session-expired");
  }
}

export function makeQueryClient() {
  let queryClient: QueryClient;

  queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        void handleAuthExpired(queryClient, error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        void handleAuthExpired(queryClient, error);
      },
    }),
    defaultOptions: {
      queries: {
        // serve cache immediately, revalidate in background
        staleTime: 60_000,
        gcTime: 5 * 60_000,//5min
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          if (isAuthExpiredError(error)) {
            return false;
          }

          return failureCount < 1;
        },
        retryDelay: 5_000,
      },
    },
  });

  return queryClient;
}
