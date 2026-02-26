export class SessionNote {
  note_id: string;
  appointment_id: string;
  counselor_id: string;
  note_content: string;
  created_at: string;

  constructor(init?: Partial<SessionNote>) {
    this.note_id = init?.note_id ?? "";
    this.appointment_id = init?.appointment_id ?? "";
    this.counselor_id = init?.counselor_id ?? "";
    this.note_content = init?.note_content ?? "";
    this.created_at = init?.created_at ?? "";
  }
}
