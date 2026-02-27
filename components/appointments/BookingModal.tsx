"use client";

import { X } from "lucide-react";

import BookingForm from "@/components/appointments/BookingForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BookingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function BookingModal({ open, onOpenChange }: BookingModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-md bg-transparent">
        <Card
          className="md3-card w-full h-full max-h-[90vh]"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Book appointment"
        >
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Book appointment</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close booking modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[70vh]">
            <BookingForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
