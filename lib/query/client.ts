import { MutationCache, QueryCache, QueryClient, focusManager } from "@tanstack/react-query";

import { isAuthExpiredError } from "@/lib/query/http";

let authExpiryRedirectInFlight = false;

const FOCUS_DEBOUNCE_MS = 10_000;
let lastFocusTime = 0;

focusManager.setEventListener((handleFocus) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      const now = Date.now();
      if (now - lastFocusTime >= FOCUS_DEBOUNCE_MS) {
        lastFocusTime = now;
        handleFocus();
      }
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange, false);
  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
});

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
    window.location.assign("/login?reason=session-expired");
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
