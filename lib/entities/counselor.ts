export class Counselor {
  counselor_id: string;
  name: string;
  email: string;
  specialization: string;
  office_room: string;
  created_at: string;

  constructor(init?: Partial<Counselor>) {
    this.counselor_id = init?.counselor_id ?? "";
    this.name = init?.name ?? "";
    this.email = init?.email ?? "";
    this.specialization = init?.specialization ?? "";
    this.office_room = init?.office_room ?? "";
    this.created_at = init?.created_at ?? "";
  }
}
