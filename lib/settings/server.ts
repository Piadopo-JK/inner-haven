import type { CounselorScheduleRuleDTO } from "@/lib/booking/contracts";
import { bookingService } from "@/lib/booking/service";
import type {
  GoogleIntegrationStatusPayload,
  ProfileSettingsCachePayload,
} from "@/lib/query/queries";
import { createServiceClient } from "@/lib/supabase/server";

type SessionUserLike = {
  userId: string;
  role: "student" | "counselor";
};

export async function loadProfileSettings(
  sessionUser: SessionUserLike,
): Promise<ProfileSettingsCachePayload> {
  const supabase = createServiceClient();

  if (sessionUser.role === "counselor") {
    const { data, error } = await supabase
      .from("counselors")
      .select("name, avatar_url, about, specialization, office_room")
      .eq("auth_user_id", sessionUser.userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Counselor profile not found");
    }

    return {
      role: "counselor",
      name: data.name,
      avatar_url: data.avatar_url,
      about: data.about,
      specialization: data.specialization,
      office_room: data.office_room,
    };
  }

  const { data, error } = await supabase
    .from("students")
    .select("name, avatar_url, year_level, course")
    .eq("auth_user_id", sessionUser.userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Student profile not found");
  }

  return {
    role: "student",
    name: data.name,
    avatar_url: data.avatar_url,
    year_level: data.year_level,
    course: data.course,
  };
}

export async function loadCounselorScheduleForUser(
  authUserId: string,
): Promise<CounselorScheduleRuleDTO[]> {
  const counselorId = await bookingService.resolveCounselorId(authUserId);

  if (!counselorId) {
    throw new Error("Counselor not found");
  }

  return bookingService.getCounselorSchedule(counselorId);
}

export async function loadGoogleIntegrationStatus(
  counselorId: string,
): Promise<GoogleIntegrationStatusPayload> {
  const googleToken = await bookingService.getCounselorGoogleToken(counselorId);

  return {
    isConnected: Boolean(googleToken),
  };
}