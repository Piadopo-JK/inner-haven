export const dynamic = "force-dynamic";

import AvailableCounselorsList from "@/components/counselor/AvailableCounselorsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingService } from "@/lib/booking/service";

export default async function CounselorsPage() {
  const counselors = await bookingService.listCounselors();

  return (
    <main className="mx-auto w-full max-w-5xl p-4">
      <Card className="md3-card">
        <CardHeader>
          <CardTitle>Counselor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailableCounselorsList counselors={counselors} />
        </CardContent>
      </Card>
    </main>
  );
}
