import {Counselor} from "@/lib/entities";

export const placeholderCounselors: Counselor[] = [
  new Counselor({
    counselor_id: "cslr-001",
    name: "Mr. Juan Dela Cruz",
    email: "juan.cruz@vsu.edu.ph",
    specialization: "Career Counseling",
    office_room: "Guidance 99",
    created_at: "",
  }),
];

export async function saveAppointmentPlaceholder(
) {
  return {
    persisted: true,
    message: "placeholder only",
  };
}
