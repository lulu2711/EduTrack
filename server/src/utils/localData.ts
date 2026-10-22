import fs from 'fs';
import path from 'path';

const configuredDataDir = process.env.DATA_DIR;
const workingDirectory = process.cwd();
const PROJECT_ROOT = configuredDataDir
  ? path.resolve(configuredDataDir)
  : fs.existsSync(path.join(workingDirectory, 'school_data.json'))
    ? workingDirectory
    : path.resolve(workingDirectory, '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'grade_subject_reports');
const CREDENTIALS_FILE = path.join(PROJECT_ROOT, 'auth_credentials.json');

export function getLocalDataDir(): string {
  return PROJECT_ROOT;
}

type CredentialRole = 'admin' | 'teacher' | 'student';
type CredentialStore = Partial<Record<CredentialRole, Record<string, string>>>;

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
  password: string; // bcrypt hash
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

function loadCredentialStore(): CredentialStore {
  if (!fs.existsSync(CREDENTIALS_FILE)) return {};
  return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8')) as CredentialStore;
}

export function getCredentialHash(role: CredentialRole, id: string): string | null {
  return loadCredentialStore()[role]?.[id] || null;
}

export function saveCredentialHash(role: CredentialRole, id: string, passwordHash: string): void {
  const store = loadCredentialStore();
  store[role] = { ...(store[role] || {}), [id]: passwordHash };
  const temporaryFile = `${CREDENTIALS_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf-8');
  fs.renameSync(temporaryFile, CREDENTIALS_FILE);
}

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
  return fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.json'));
}

export function reloadLocalData() {
  clearCache();
  const schoolData = loadSchoolData();
  const teachers = loadTeachers();
  const gradeReportFiles = getAllGradeReportFiles();
  gradeReportFiles.forEach(loadGradeReport);
  return {
    schoolFiles: 1,
    teacherFiles: 1,
    gradeReportFiles: gradeReportFiles.length,
    classCount: schoolData.classes.length,
    studentCount: schoolData.classes.reduce((sum, cls) => sum + cls.students.length, 0),
    teacherCount: teachers.teachers.length,
  };
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
    return compareExamNames(a.考试, b.考试);
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
  const exams = new Set<string>();
  getAllGradeReportFiles().forEach(file => {
    exams.add(loadGradeReport(file).考试);
  });
  return Array.from(exams).sort(compareExamNames);
}

function compareExamNames(a: string, b: string): number {
  const getOrder = (name: string): [number, number] => {
    if (name.includes('期末')) return [300, 0];
    if (name.includes('期中')) return [200, 0];
    const monthly = name.match(/月考\s*(\d+)/);
    if (monthly) return [100, Number(monthly[1])];
    return [150, 0];
  };

  const [aGroup, aIndex] = getOrder(a);
  const [bGroup, bIndex] = getOrder(b);
  return aGroup - bGroup || aIndex - bIndex || a.localeCompare(b, 'zh-CN');
}

export function getLatestExam(): string | null {
  return getAvailableExams().at(-1) || null;
}

export function clearCache(): void {
  cachedSchoolData = null;
  cachedTeachers = null;
  cachedGradeReports.clear();
}
