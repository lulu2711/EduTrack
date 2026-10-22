import { Router } from 'express';
import {
  createOnlineExamHandler,
  getOnlineExam,
  getOnlineExamResults,
  getOnlineExams,
  submitOnlineExam,
  gradeOnlineSubmission,
  getClassKnowledgeAnalysis,
  getMyKnowledgeAnalysis,
} from '../controllers/onlineExam.controller';
import { authenticate, authorize } from '../middleware/auth';
import { identifier, requiredString, validate } from '../middleware/validation';

const router = Router();
router.use(authenticate);
router.post('/:examId/submissions/:studentId/grade', authorize('teacher'),
  validate('params', { examId: identifier('考试ID'), studentId: identifier('学生ID') }), gradeOnlineSubmission);

router.get('/', getOnlineExams);
router.get('/:examId/knowledge-analysis/class', validate('params', { examId: identifier('考试ID') }), authorize('teacher', 'admin'), getClassKnowledgeAnalysis);
router.get('/:examId/knowledge-analysis/me', validate('params', { examId: identifier('考试ID') }), authorize('student'), getMyKnowledgeAnalysis);
router.get('/:examId', validate('params', { examId: identifier('考试ID') }), getOnlineExam);
router.get('/:examId/results', validate('params', { examId: identifier('考试ID') }), authorize('teacher', 'admin'), getOnlineExamResults);
router.post(
  '/',
  authorize('teacher'),
  validate('body', {
    title: requiredString('考试名称', 1, 100),
    subject: requiredString('科目', 1, 50),
    classId: identifier('班级ID'),
  }),
  createOnlineExamHandler
);
router.post(
  '/:examId/submit',
  authorize('student'),
  validate('params', { examId: identifier('考试ID') }),
  validate('body', { answers: value => value && typeof value === 'object' ? null : '答案格式不正确' }),
  submitOnlineExam
);

export default router;
