import LoaderAnimations, { GentleWaveLoader } from "@/components/loading/BrandedLoaders";
import { LOADING_MESSAGES } from "@/lib/loading/states";

export default function Loading() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl p-4">
      <LoaderAnimations />
      <GentleWaveLoader
        message={LOADING_MESSAGES.chat.conversation}
        className="flex min-h-[50vh] items-center justify-center"
      />
    </main>
  );
}
