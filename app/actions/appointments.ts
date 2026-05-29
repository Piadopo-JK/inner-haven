"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { AppointmentDTO } from "@/lib/booking/contracts";
import { appointmentTag, appointmentsListTag } from "@/lib/cache/appointments-cache";
import { bookingService } from "@/lib/booking/service";
import { getSessionUser } from "@/lib/supabase/get-session-user";


//update appointment status.
export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: "approved" | "cancelled",
): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "counselor") {
    throw new Error("Unauthorized");
  }

  const appointment = await bookingService.getAppointmentById(appointmentId);
  if (!appointment) {
    throw new Error("Forbidden");
  }

  try {
    await bookingService.updateAppointmentStatus(appointmentId, status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("GOOGLE_RECONNECT_REQUIRED:")) {
      redirect("/settings?reconnect=google");
    }

    if (message.startsWith("GOOGLE_MEET_CREATE_FAILED:")) {
      throw new Error(
        "Unable to create a Google Meet link right now. Please try again.",
      );
    }

    throw error;
  }

  revalidateTag(appointmentsListTag("counselor", sessionUser.userId), "max");
  revalidateTag(appointmentTag(appointmentId), "max");
}

// student cancels their pending or approved appointment
export async function cancelStudentAppointmentAction(appointmentId: string): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "student") {
    throw new Error("Unauthorized");
  }

  const target = await bookingService.getAppointmentById(appointmentId);
  if (!target) {
    throw new Error("Forbidden");
  }

  if (target.status === "cancelled" || target.status === "completed") {
    throw new Error("Appointment cannot be cancelled");
  }

  await bookingService.updateAppointmentStatus(appointmentId, "cancelled");
  revalidateTag(appointmentsListTag("student", sessionUser.userId), "max");
  revalidateTag(appointmentTag(appointmentId), "max");
}

//counselor marks a past approved appointment as completed.
export async function completeAppointmentAction(appointmentId: string): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "counselor") {
    throw new Error("Unauthorized");
  }

  const targetAppointment = await bookingService.getAppointmentById(appointmentId);
  if (!targetAppointment) {
    throw new Error("Forbidden");
  }

  const todayIso = new Date().toISOString().split("T")[0];
  const isPastAppointment = targetAppointment.appointment_date < todayIso;
  const isApproved = targetAppointment.status === "approved";
  const isCompleted = targetAppointment.status === "completed";

  if (isCompleted) {
    revalidateTag(appointmentsListTag("counselor", sessionUser.userId), "max");
    revalidateTag(appointmentTag(appointmentId), "max");
    return;
  }

  if (!isApproved || !isPastAppointment) {
    throw new Error("Appointment is not eligible for completion");
  }

  await bookingService.updateAppointmentStatus(appointmentId, "completed");
  revalidateTag(appointmentsListTag("counselor", sessionUser.userId), "max");
  revalidateTag(appointmentTag(appointmentId), "max");
}

//student updates own pending appointment.
export async function updateStudentPendingAppointmentAction(
  appointmentId: string,
  input: {
    counselor_id: string;
    appointment_date: string;
    appointment_time: string;
    reason: string;
    mode: "in_person" | "online";
  },
): Promise<AppointmentDTO> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "student") {
    throw new Error("Unauthorized");
  }

  const target = await bookingService.getAppointmentById(appointmentId);
  if (!target) {
    throw new Error("Forbidden");
  }

  if (target.status !== "pending") {
    throw new Error("Only pending appointments can be edited");
  }

  const updated = await bookingService.updateAppointment(appointmentId, {
    student_id: sessionUser.userId,
    counselor_id: input.counselor_id,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    reason: input.reason,
    mode: input.mode,
  });

  if (!updated) {
    throw new Error("Appointment not found");
  }

  revalidateTag(appointmentsListTag("student", sessionUser.userId), "max");
  revalidateTag(appointmentTag(appointmentId), "max");

  return updated;
}

//counselor reschedules own pending appointment date/time only.
export async function rescheduleCounselorAppointmentAction(
  appointmentId: string,
  appointmentDate: string,
  appointmentTime: string,
): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "counselor") {
    throw new Error("Unauthorized");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    throw new Error("Invalid appointment date");
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(appointmentTime)) {
    throw new Error("Invalid appointment time");
  }

  const target = await bookingService.getAppointmentById(appointmentId);
  if (!target) {
    throw new Error("Forbidden");
  }

  if (target.status !== "pending") {
    throw new Error("Only pending appointments can be rescheduled");
  }

  await bookingService.rescheduleAppointment(appointmentId, appointmentDate, appointmentTime);

  revalidateTag(appointmentsListTag("counselor", sessionUser.userId), "max");
  revalidateTag(appointmentTag(appointmentId), "max");
}
