"use client";

import { useActionState } from "react";
import { setupStudentProfile } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle } from "lucide-react";

const initialState = { error: "" };

export default function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(setupStudentProfile, initialState);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-muted-foreground" />
          Student Profile
        </CardTitle>
        <CardDescription>
          Please enter your real name as it will appear to your counselors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          {(state as { error?: string })?.error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20 animate-in slide-in-from-top-1">
              {(state as { error?: string }).error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Complete Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
