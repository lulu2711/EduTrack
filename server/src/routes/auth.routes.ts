import { Router } from 'express';
import {
  studentLogin,
  teacherLogin,
  adminLogin,
  changePassword,
  getCurrentUser,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// 公开路由
router.post('/login/student', studentLogin);
router.post('/login/teacher', teacherLogin);
router.post('/login/admin', adminLogin);

// 需要认证的路由
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, getCurrentUser);

export default router;
