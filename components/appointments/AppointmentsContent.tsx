"use client";

import { useMemo } from "react";

import AppointmentsPageClient from "@/components/appointments/AppointmentsPageClient";
import { useCounselors, EMPTY_COUNSELORS } from "@/lib/query/hooks/useCounselors";
import { useStudents, EMPTY_STUDENTS } from "@/lib/query/hooks/useStudents";

type AppointmentsContentProps = {
  role: "student" | "counselor";
};

export default function AppointmentsContent({ role }: AppointmentsContentProps) {
  const isCounselor = role === "counselor";

  const { data: counselors = EMPTY_COUNSELORS } = useCounselors(!isCounselor);
  const { data: students = EMPTY_STUDENTS } = useStudents(isCounselor);

  const participantMap = useMemo(() => {
    if (isCounselor) {
      const map: Record<string, { name: string; avatar?: string }> = {};
      for (const s of students) {
        map[s.student_id] = { name: s.name, avatar: s.avatar_url };
      }
      return map;
    }
    const map: Record<string, { name: string; avatar?: string }> = {};
    for (const c of counselors) {
      map[c.counselor_id] = { name: c.name, avatar: c.avatar_url };
    }
    return map;
  }, [isCounselor, counselors, students]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 md:px-6">
      <AppointmentsPageClient role={role} participantMap={participantMap} />
    </main>
  );
}
