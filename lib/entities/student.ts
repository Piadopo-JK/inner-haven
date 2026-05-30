export type StudentProps = {
  student_id: string;
  name: string;
  email: string;
  created_at?: string;
};

export class Student {
  student_id: string;
  name: string;
  email: string;
  created_at?: string;

  constructor(props: StudentProps) {
    this.student_id = props.student_id;
    this.name = props.name;
    this.email = props.email;
    this.created_at = props.created_at;
  }
}
