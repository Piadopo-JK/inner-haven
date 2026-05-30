export type CounselorProps = {
  counselor_id: string;
  name: string;
  email: string;
  specialization: string;
  office_room: string;
  created_at?: string;
};

export class Counselor {
  counselor_id: string;
  name: string;
  email: string;
  specialization: string;
  office_room: string;
  created_at?: string;

  constructor(props: CounselorProps) {
    this.counselor_id = props.counselor_id;
    this.name = props.name;
    this.email = props.email;
    this.specialization = props.specialization;
    this.office_room = props.office_room;
    this.created_at = props.created_at;
  }
}
