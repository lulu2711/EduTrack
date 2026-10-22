import { Class, Grade, Student, Score, Exam } from '../models';
import { mongoReady } from './mongoAuth';
import { getClassById, getAllClasses } from './localData';

const classDto = (c: any, grade: any, count: number) => { const legacy = getAllClasses().find(item => item.name === c.name); return ({ id: legacy?.id || String(c._id), mongoId: String(c._id), legacyId: legacy?.id || String(c._id), name: c.name, grade: grade?.name || '', studentCount: count, combination: { physics_history: c.combination?.physicsHistory || '', electives: c.combination?.electives || [] }, subjects: c.subjects || [] }); };
export async function mongoClasses() {
  if (!mongoReady()) return null;
  const [classes, grades] = await Promise.all([Class.find().sort({ order: 1 }).lean(), Grade.find().lean()]);
  const gradeMap = new Map(grades.map(g => [String(g._id), g]));
  return Promise.all(classes.map(async c => classDto(c, gradeMap.get(String(c.gradeId)), await Student.countDocuments({ classId: c._id }))));
}
export async function mongoClass(classId: string) {
  if (!mongoReady()) return null;
  const local = getClassById(classId); const c = local ? await Class.findOne({ name: local.name }).lean() : await Class.findById(classId).lean();
  if (!c) return null;
  const grade = await Grade.findById(c.gradeId).lean(); const students = await Student.find({ classId: c._id }).select('studentId name').lean();
  return { ...classDto(c, grade, students.length), students: students.map(s => ({ id: s.studentId, name: s.name })) };
}
function legacyScore(s: any, student: any, exam: any, cls: any) { return { 班级: cls?.name || '', 学号: student?.studentId || '', 姓名: student?.name || '', 考试: exam?.name || '', 总分: s.score, 满分: s.totalScore, 排名: s.rank, 班级人数: s.classSize, 科目: s.subject, [s.subject]: s.score }; }
export async function mongoStudentScores(studentId: string) {
  if (!mongoReady()) return null;
  const student = await Student.findOne({ studentId }).lean(); if (!student) return null;
  const [scores, exams, cls] = await Promise.all([Score.find({ studentId: student._id }).lean(), Exam.find().lean(), Class.findById(student.classId).lean()]);
  const examsById = new Map(exams.map(e => [String(e._id), e])); return scores.map(s => legacyScore(s, student, examsById.get(String(s.examId)), cls));
}
export async function mongoClassScores(classId: string) {
  if (!mongoReady()) return null;
  const local = getClassById(classId); const cls = local ? await Class.findOne({ name: local.name }).lean() : await Class.findById(classId).lean(); if (!cls) return null;
  const [scores, students, exams] = await Promise.all([Score.find({ classId: cls._id }).lean(), Student.find({ classId: cls._id }).lean(), Exam.find().lean()]);
  const sm = new Map(students.map(s => [String(s._id), s])); const em = new Map(exams.map(e => [String(e._id), e])); return { cls, scores: scores.map(s => legacyScore(s, sm.get(String(s.studentId)), em.get(String(s.examId)), cls)) };
}

