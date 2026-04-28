import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt';

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
