import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User, Student, Teacher, Class, Grade } from '../models';
import { findTeacherByName } from './localData';
import { requireMongoConnection } from './dataSource';

export const mongoReady = () => { requireMongoConnection(); return mongoose.connection.readyState === 1; };

export async function findMongoStudent(studentId: string) {
  const user = await User.findOne({ username: studentId, role: 'student', isActive: true }).lean();
  if (!user) return null;
  const student = await Student.findById(user.refId).lean();
  if (!student) return null;
  const cls = await Class.findById(student.classId).lean();
  const grade = await Grade.findById(student.gradeId).lean();
  return { user, student, cls, grade };
}

export async function findMongoTeacher(employeeId: string) {
  const local = findTeacherByName(employeeId) || (await import('./localData')).findTeacherById(employeeId);
  let user = await User.findOne({ username: employeeId, role: 'teacher', isActive: true }).lean();
  let teacher = user ? await Teacher.findById(user.refId).lean() : null;
  if (!teacher && local) {
    teacher = await Teacher.findOne({ name: local.name }).lean();
    if (teacher) user = await User.findOne({ refId: teacher._id, role: 'teacher', isActive: true }).lean();
  }
  if (!user || !teacher) return null;
  if (!teacher) return null;
  const cls = teacher.classIds?.[0] ? await Class.findById(teacher.classIds[0]).lean() : null;
  const grade = teacher.gradeIds?.[0] ? await Grade.findById(teacher.gradeIds[0]).lean() : null;
  const localTeacher = local || findTeacherByName(teacher.name);
  return { user, teacher, cls, grade, local: localTeacher };
}

export async function verifyMongoPassword(hash: string, password: string) {
  return bcrypt.compare(password, hash);
}


