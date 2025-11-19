export interface StandardizedLecture {
  group: string;
  courseCode: string;
  courseName: string;
  hours: number;
  credits: number;
  capacity: number;
  professor: string;
  schedule: Array<{
    day: string;
    periods: number[];
    classroom: string;
  }>;
  campus?: string;
  department?: string;
  major?: string;
  courseType?: string;
}

export interface StandardizedTimetable {
  university: string;
  campus: string;
  department: string;
  major: string;
  year: number;
  semester: string;
  lectures: StandardizedLecture[];
  courseType: string;
}