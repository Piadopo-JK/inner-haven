import type { QueryClient } from "@tanstack/react-query";

const DEBOUNCE_MS = 150;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function debouncedInvalidate(
  queryClient: QueryClient,
  opts: NonNullable<Parameters<QueryClient["invalidateQueries"]>[0]>,
) {
  const key = JSON.stringify(opts.queryKey);
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);

  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      void queryClient.invalidateQueries(opts);
    }, DEBOUNCE_MS),
  );
}
