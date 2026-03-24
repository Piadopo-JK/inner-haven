export type SessionNoteProps = {
  note_id: string;
  appointment_id: string;
  counselor_id: string;
  note_content: string;
  created_at?: string;
};

export class SessionNote {
  note_id: string;
  appointment_id: string;
  counselor_id: string;
  note_content: string;
  created_at?: string;

  constructor(props: SessionNoteProps) {
    this.note_id = props.note_id;
    this.appointment_id = props.appointment_id;
    this.counselor_id = props.counselor_id;
    this.note_content = props.note_content;
    this.created_at = props.created_at;
  }
}
