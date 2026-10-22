import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt';
import { findStudentById, findTeacherById } from '../utils/localData';
import { mongoReady } from '../utils/mongoAuth';
import { mongoCanViewClass, mongoCanViewStudent } from '../utils/mongoPermissions';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT 认证中间件（本地数据模式）
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未提供认证令牌' },
      });
      return;
    }

    const decoded = verifyToken(token);
    
    // 本地数据模式：直接信任token中的用户信息
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: '认证令牌已过期' },
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '无效的认证令牌' },
    });
  }
};

/**
 * 角色授权中间件工厂
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未认证' },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '无权访问此资源' },
      });
      return;
    }

    next();
  };
};

const forbidden = (res: Response): void => {
  res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message: '无权访问此资源' },
  });
};

/**
 * 资源级权限：
 * - 管理员可以访问所有资源
 * - 教师只能访问自己负责的班级
 * - 学生只能访问自己所属的班级
 */
export const authorizeClassParam = (paramName = 'classId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user; const classId = req.params[paramName];
    if (!user || !classId) { forbidden(res); return; }
    if (mongoReady()) { try { if (await mongoCanViewClass(user.role, user.refId, classId)) { next(); return; } } catch (error) { console.error('Mongo class permission check failed:', error); } forbidden(res); return; }
    if (user.role === 'admin' || (user.role === 'teacher' && findTeacherById(user.refId)?.classId === classId)) { next(); return; }
    forbidden(res);
  };
};
/**
 * 资源级权限：
 * - 管理员和教师可以访问学生详情
 * - 学生只能访问自己的详情
 * - 教师只能访问自己负责班级中的学生
 */
export const authorizeStudentParam = (paramName = 'studentId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user; const studentId = req.params[paramName];
    if (!user || !studentId) { forbidden(res); return; }
    if (mongoReady()) { try { if (await mongoCanViewStudent(user.role, user.refId, studentId)) { next(); return; } } catch (error) { console.error('Mongo student permission check failed:', error); } forbidden(res); return; }
    if (user.role === 'admin' || (user.role === 'student' && user.refId === studentId)) { next(); return; }
    if (user.role === 'teacher') { const student = findStudentById(studentId); const teacher = findTeacherById(user.refId); if (student && teacher?.classId === student.classInfo.id) { next(); return; } }
    forbidden(res);
  };
};
/**
 * 教师详情只允许管理员或教师本人查看。
 */
export const authorizeTeacherParam = (paramName = 'teacherId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    const teacherId = req.params[paramName];

    if (
      user &&
      (user.role === 'admin' || (user.role === 'teacher' && user.refId === teacherId))
    ) {
      next();
      return;
    }

    forbidden(res);
  };
};

