import { createBrowserClient } from "@supabase/ssr";

type CreateClientOptions = {
  headers?: Record<string, string>;
};

export function createClient(options?: CreateClientOptions) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        headers: options?.headers,
      },
    },
  );
}
