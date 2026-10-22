import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { listForum, createForumPost, replyForumPost, likeForumPost, reportForumPost, moderateForum } from '../controllers/forum.controller';
const router = Router(); router.use(authenticate);
router.get('/', listForum); router.post('/posts', createForumPost); router.post('/posts/:postId/replies', replyForumPost); router.post('/posts/:postId/like', likeForumPost); router.post('/posts/:postId/report', reportForumPost); router.patch('/posts/:postId/moderate', authorize('admin', 'teacher'), moderateForum);
export default router;
