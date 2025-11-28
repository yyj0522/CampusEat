export type ValidationType = 'STATIC' | 'AI';

export class ValidationIssue {
  lectureIndex: number; 
  courseName: string;  
  field: string;        
  message: string;     
  type: ValidationType; 
  severity: 'ERROR' | 'WARNING'; 
}

export class TimetableValidationResult {
  isValid: boolean;
  totalLectures: number;
  issues: ValidationIssue[];

  constructor() {
    this.isValid = true;
    this.issues = [];
    this.totalLectures = 0;
  }
}