import { createBrowserClient } from "@supabase/ssr";

type CreateClientOptions = {
  headers?: Record<string, string>;
};

let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient(options?: CreateClientOptions) {
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: options?.headers,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      },
    );
  }

  if (!_browserClient) {
    _browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: options?.headers,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      },
    );
  }

  return _browserClient;
}
