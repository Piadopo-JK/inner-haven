export class Student {
  student_id: string;
  name: string;
  email: string;
  password: string;
  course: string;
  year_level: number;
  created_at: string;

  constructor(init?: Partial<Student>) {
    this.student_id = init?.student_id ?? "";
    this.name = init?.name ?? "";
    this.email = init?.email ?? "";
    this.password = init?.password ?? "";
    this.course = init?.course ?? "";
    this.year_level = init?.year_level ?? 1;
    this.created_at = init?.created_at ?? "";
  }
}
