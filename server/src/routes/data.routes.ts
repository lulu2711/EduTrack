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
} from '../controllers/data.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard/stats', authorize('admin'), getDashboardStats);

router.get('/classes', getAllClassesHandler);
router.get('/classes/:classId', getClassDetail);
router.get('/classes/:classId/scores', getClassScoresHandler);
router.get('/classes/:classId/analysis', getClassAnalysis);
router.get('/classes/:classId/distribution', getGradeDistribution);
router.get('/classes/:classId/progress', getProgressStudents);

router.get('/teachers', authorize('admin'), getAllTeachersHandler);
router.get('/teachers/:teacherId', getTeacherDetail);

router.get('/students/search', searchStudents);
router.get('/students/:studentId', getStudentDetail);
router.get('/students/:studentId/scores', getStudentScoresHandler);

router.get('/exams', getExams);

export default router;
