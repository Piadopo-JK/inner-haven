import { CounselorDirectoryItemDTO } from "@/lib/booking/contracts";
import CounselorCard from "@/components/counselor/CounselorCard";

type LandingCounselorShowcaseProps = {
  counselors: CounselorDirectoryItemDTO[];
};

export default function LandingCounselorShowcase({
  counselors,
}: LandingCounselorShowcaseProps) {
  const displayCounselors = counselors.slice(0, 3);

  if (displayCounselors.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          className="mb-2 text-center text-3xl font-bold tracking-tight"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          Meet Our Counselors
        </h2>
        <p
          className="mb-10 text-center"
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        >
          Experienced professionals ready to support your well-being
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayCounselors.map((counselor, i) => (
            <CounselorCard
              key={counselor.counselor_id}
              counselor={counselor}
              canBook
              canMessage={false}
              colorIndex={i}
              priority={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
