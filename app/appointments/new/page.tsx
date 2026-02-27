import { Suspense } from "react";

import BookingForm from "@/components/appointments/BookingForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewAppointmentPage() {
  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <Card className="md3-card">
        <CardHeader>
          <CardTitle>Create appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <BookingForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
