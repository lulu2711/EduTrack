import { Router } from 'express';
import { askAssistant } from '../controllers/assistant.controller';
import { authenticate, authorize } from '../middleware/auth';
import { requiredString, validate } from '../middleware/validation';

const router = Router();
router.use(authenticate, authorize('student', 'teacher', 'admin'));
router.post('/ask', validate('body', { question: requiredString('问题', 1, 1000) }), askAssistant);

export default router;

