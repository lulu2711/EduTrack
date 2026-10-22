import jwt, { SignOptions } from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is required and must be at least 32 characters long');
  }
  return secret;
};

const getJwtExpiresIn = (): SignOptions['expiresIn'] => {
  return (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
};

export interface TokenPayload {
  userId: string;
  role: 'student' | 'teacher' | 'admin';
  refId: string;
}

/**
 * 生成 JWT Token
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  } as SignOptions);
};

/**
 * 验证 JWT Token
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
};

/**
 * 从请求头中提取 Token
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
