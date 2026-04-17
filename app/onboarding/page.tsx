"use client";

import { useActionState } from "react";
import { setupStudentProfile } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, UserCircle } from "lucide-react";

const initialState = {
  error: "",
};

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(setupStudentProfile, initialState);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500 ease-out flex flex-col gap-8">
        
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-2xl shadow-sm ring-1 ring-black/5 backdrop-blur-xl">
             <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome to Inner Haven
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Let&apos;s get your profile set up so you can start booking appointments.
          </p>
        </div>

        <Card className="border-0 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-200/50 dark:ring-slate-800/50 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-slate-400" />
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
                  className="bg-white/50 dark:bg-slate-950/50 border-slate-200/50 dark:border-slate-800/50 h-11 transition-all focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {(state as {error?: string})?.error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/50 animate-in slide-in-from-top-1">
                  {(state as {error?: string}).error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]" 
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
