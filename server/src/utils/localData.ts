import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = 'c:\\Users\\mimo\\Desktop\\Edu';

export interface LocalStudent {
  id: string;
  name: string;
}

export interface LocalClass {
  id: string;
  name: string;
  grade: string;
  gradeIdx: number;
  classIdx: number;
  combination: {
    physics_history: string;
    electives: string[];
  };
  subjects: string[];
  students: LocalStudent[];
}

export interface LocalTeacher {
  id: string;
  name: string;
  classId: string;
  className: string;
  grade: string;
  password: string;
}

export interface ScoreRecord {
  班级: string;
  学号: string;
  姓名: string;
  考试: string;
  总分: number;
  满分: number;
  排名: number;
  班级人数: number;
  [subject: string]: string | number;
}

export interface GradeReport {
  年级: string;
  选科: string;
  考试: string;
  班级数: number;
  学生数: number;
  成绩: ScoreRecord[];
}

let cachedSchoolData: { classes: LocalClass[] } | null = null;
let cachedTeachers: { teachers: LocalTeacher[] } | null = null;
let cachedGradeReports: Map<string, GradeReport> = new Map();

export function loadSchoolData(): { classes: LocalClass[] } {
  if (cachedSchoolData) {
    return cachedSchoolData;
  }

  const filePath = path.join(PROJECT_ROOT, 'school_data.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  cachedSchoolData = JSON.parse(data);
  return cachedSchoolData!;
}

export function loadTeachers(): { teachers: LocalTeacher[] } {
  if (cachedTeachers) {
    return cachedTeachers;
  }

  const filePath = path.join(PROJECT_ROOT, 'teachers.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  cachedTeachers = JSON.parse(data);
  return cachedTeachers!;
}

export function loadGradeReport(filename: string): GradeReport {
  if (cachedGradeReports.has(filename)) {
    return cachedGradeReports.get(filename)!;
  }

  const filePath = path.join(PROJECT_ROOT, 'grade_subject_reports', filename);
  const data = fs.readFileSync(filePath, 'utf-8');
  const report: GradeReport = JSON.parse(data);
  cachedGradeReports.set(filename, report);
  return report;
}

export function getAllGradeReportFiles(): string[] {
  const dirPath = path.join(PROJECT_ROOT, 'grade_subject_reports');
  return fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
}

export function findStudentById(studentId: string): { student: LocalStudent; classInfo: LocalClass } | null {
  const schoolData = loadSchoolData();

  for (const cls of schoolData.classes) {
    const student = cls.students.find(s => s.id === studentId);
    if (student) {
      return { student, classInfo: cls };
    }
  }

  return null;
}

export function findTeacherByName(name: string): LocalTeacher | null {
  const teachersData = loadTeachers();
  return teachersData.teachers.find(t => t.name === name) || null;
}

export function findTeacherById(id: string): LocalTeacher | null {
  const teachersData = loadTeachers();
  return teachersData.teachers.find(t => t.id === id) || null;
}

export function getStudentsByClass(classId: string): LocalStudent[] {
  const schoolData = loadSchoolData();
  const cls = schoolData.classes.find(c => c.id === classId);
  return cls?.students || [];
}

export function getClassById(classId: string): LocalClass | null {
  const schoolData = loadSchoolData();
  return schoolData.classes.find(c => c.id === classId) || null;
}

export function getAllClasses(): LocalClass[] {
  const schoolData = loadSchoolData();
  return schoolData.classes;
}

export function getAllTeachers(): LocalTeacher[] {
  const teachersData = loadTeachers();
  return teachersData.teachers;
}

export function getStudentScores(studentId: string): ScoreRecord[] {
  const files = getAllGradeReportFiles();
  const scores: ScoreRecord[] = [];

  for (const file of files) {
    const report = loadGradeReport(file);
    const studentScore = report.成绩.find(s => s.学号 === studentId);
    if (studentScore) {
      scores.push(studentScore);
    }
  }

  return scores.sort((a, b) => {
    const examOrder = ['月考1', '月考2', '月考3', '期中考试', '期末考试'];
    return examOrder.indexOf(a.考试) - examOrder.indexOf(b.考试);
  });
}

export function getClassScores(className: string): ScoreRecord[] {
  const files = getAllGradeReportFiles();
  const scores: ScoreRecord[] = [];

  for (const file of files) {
    const report = loadGradeReport(file);
    const classScores = report.成绩.filter(s => s.班级 === className);
    scores.push(...classScores);
  }

  return scores;
}

export function getAvailableExams(): string[] {
  return ['月考1', '月考2', '月考3', '期中考试', '期末考试'];
}

export function clearCache(): void {
  cachedSchoolData = null;
  cachedTeachers = null;
  cachedGradeReports.clear();
}
