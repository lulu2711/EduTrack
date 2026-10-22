import { Router } from 'express';
import {
  getAllClassesHandler,
  getClassDetail,
  getAllTeachersHandler,
  getTeacherDetail,
  getStudentDetail,
  getStudentScoresHandler,
  getClassScoresHandler,
  getClassAnalysis,
  getExams,
  getGradeDistribution,
  getProgressStudents,
  searchStudents,
  getDashboardStats,
  reloadLocalDataHandler,
} from '../controllers/data.controller';
import {
  authenticate,
  authorize,
  authorizeClassParam,
  authorizeStudentParam,
  authorizeTeacherParam,
} from '../middleware/auth';
import { identifier, optionalString, requiredString, validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.get('/dashboard/stats', authorize('admin'), getDashboardStats);
router.post('/import/reload', authorize('admin'), reloadLocalDataHandler);

router.get('/classes', getAllClassesHandler);
const classParam = validate('params', { classId: identifier('班级ID') });
const studentParam = validate('params', { studentId: identifier('学生ID') });
const teacherParam = validate('params', { teacherId: identifier('教师ID') });

router.get('/classes/:classId', classParam, authorizeClassParam(), getClassDetail);
router.get('/classes/:classId/scores', classParam, authorizeClassParam(), getClassScoresHandler);
router.get('/classes/:classId/analysis', classParam, authorizeClassParam(), getClassAnalysis);
router.get('/classes/:classId/distribution', classParam, validate('query', { exam: optionalString('考试名称') }), authorizeClassParam(), getGradeDistribution);
router.get('/classes/:classId/progress', classParam, authorizeClassParam(), getProgressStudents);

router.get('/teachers', authorize('admin'), getAllTeachersHandler);
router.get('/teachers/:teacherId', teacherParam, authorizeTeacherParam(), getTeacherDetail);

router.get('/students/search', validate('query', {
  keyword: requiredString('搜索关键词', 1, 100),
}), searchStudents);
router.get('/students/:studentId', studentParam, authorizeStudentParam(), getStudentDetail);
router.get('/students/:studentId/scores', studentParam, authorizeStudentParam(), getStudentScoresHandler);

router.get('/exams', getExams);

export default router;
