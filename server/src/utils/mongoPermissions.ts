import { Class, Student, Teacher, User } from '../models';
import { findTeacherById, findStudentById, getClassById } from './localData';
export async function mongoCanViewClass(role: string, refId: string, classId: string) {
  if (role === 'admin') return true;
  const localClass = getClassById(classId);
  const target = localClass ? await Class.findOne({ name: localClass.name }).lean() : await Class.findById(classId).lean();
  if (!target) return false;
  if (role === 'student') { const user = await User.findOne({ role: 'student', username: refId, isActive: true }).lean(); const student = user ? await Student.findById(user.refId).lean() : null; return Boolean(student && String(student.classId) === String(target._id)); }
  if (role === 'teacher') { const local = findTeacherById(refId); const teacher = local ? await Teacher.findOne({ name: local.name }).lean() : await Teacher.findById(refId).lean(); return Boolean(teacher?.classIds?.some(id => String(id) === String(target._id))); }
  return false;
}
export async function mongoCanViewStudent(role: string, refId: string, studentId: string) {
  if (role === 'admin') return true;
  const user = await User.findOne({ role: 'student', username: studentId, isActive: true }).lean();
  const student = user ? await Student.findById(user.refId).lean() : null;
  if (!student) return false;
  if (role === 'student') return refId === studentId;
  const local = findTeacherById(refId); const teacher = local ? await Teacher.findOne({ name: local.name }).lean() : null;
  return Boolean(teacher?.classIds?.some(id => String(id) === String(student.classId)));
}
