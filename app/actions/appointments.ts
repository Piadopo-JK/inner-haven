"use server";

import { revalidatePath } from "next/cache";

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

  const ownAppointments = await bookingService.listAppointments({
    role: "counselor",
    counselor_id: sessionUser.userId,
  });
  const owns = ownAppointments.some((a) => a.appointment_id === appointmentId);
  if (!owns) {
    throw new Error("Forbidden");
  }

  await bookingService.updateAppointmentStatus(appointmentId, status);
  revalidatePath("/dashboard");
}

//student cancels own pending or approved appointment.
export async function cancelStudentAppointmentAction(appointmentId: string): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "student") {
    throw new Error("Unauthorized");
  }

  const ownAppointments = await bookingService.listAppointments({
    role: "student",
    student_id: sessionUser.userId,
  });

  const target = ownAppointments.find((a) => a.appointment_id === appointmentId);
  if (!target) {
    throw new Error("Forbidden");
  }

  if (target.status === "cancelled" || target.status === "completed") {
    throw new Error("Appointment cannot be cancelled");
  }

  await bookingService.updateAppointmentStatus(appointmentId, "cancelled");
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

//counselor marks a past approved appointment as completed.
export async function completeAppointmentAction(appointmentId: string): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "counselor") {
    throw new Error("Unauthorized");
  }

  const ownAppointments = await bookingService.listAppointments({
    role: "counselor",
    counselor_id: sessionUser.userId,
  });
  const targetAppointment = ownAppointments.find((a) => a.appointment_id === appointmentId);
  if (!targetAppointment) {
    throw new Error("Forbidden");
  }

  const todayIso = new Date().toISOString().split("T")[0];
  const isPastAppointment = targetAppointment.appointment_date < todayIso;
  const isApproved = targetAppointment.status === "approved";
  const isCompleted = targetAppointment.status === "completed";

  if (isCompleted) {
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${appointmentId}`);
    return;
  }

  if (!isApproved || !isPastAppointment) {
    throw new Error("Appointment is not eligible for completion");
  }

  await bookingService.updateAppointmentStatus(appointmentId, "completed");
  revalidatePath("/dashboard");
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
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
): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "student") {
    throw new Error("Unauthorized");
  }

  const ownAppointments = await bookingService.listAppointments({
    role: "student",
    student_id: sessionUser.userId,
  });

  const target = ownAppointments.find((a) => a.appointment_id === appointmentId);
  if (!target) {
    throw new Error("Forbidden");
  }

  if (target.status !== "pending") {
    throw new Error("Only pending appointments can be edited");
  }

  await bookingService.updateAppointment(appointmentId, {
    student_id: sessionUser.userId,
    counselor_id: input.counselor_id,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    reason: input.reason,
    mode: input.mode,
  });

  revalidatePath("/dashboard");
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
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

  const ownAppointments = await bookingService.listAppointments({
    role: "counselor",
    counselor_id: sessionUser.userId,
  });

  const target = ownAppointments.find((a) => a.appointment_id === appointmentId);
  if (!target) {
    throw new Error("Forbidden");
  }

  if (target.status !== "pending") {
    throw new Error("Only pending appointments can be rescheduled");
  }

  await bookingService.rescheduleAppointment(appointmentId, appointmentDate, appointmentTime);

  revalidatePath("/dashboard");
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
}
