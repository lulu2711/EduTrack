import { NextFunction, Request, Response } from 'express';

export type ValidationIssue = { field: string; message: string };
type Validator = (value: unknown, request: Request) => string | null;

export const validate = (
  source: 'body' | 'params' | 'query',
  schema: Record<string, Validator>
) => (req: Request, res: Response, next: NextFunction): void => {
  const input = req[source] as Record<string, unknown>;
  const details: ValidationIssue[] = [];
  Object.entries(schema).forEach(([field, validator]) => {
    const message = validator(input[field], req);
    if (message) details.push({ field, message });
  });
  if (details.length > 0) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: '请求参数不正确', details },
    });
    return;
  }
  next();
};

export const requiredString = (label: string, minLength = 1, maxLength = 200): Validator =>
  value => {
    if (typeof value !== 'string' || value.trim().length < minLength) return `${label}不能为空且长度不能少于${minLength}个字符`;
    return value.trim().length > maxLength ? `${label}长度不能超过${maxLength}个字符` : null;
  };

export const optionalString = (label: string, maxLength = 200): Validator =>
  value => value === undefined || value === ''
    ? null
    : typeof value === 'string' && value.trim().length <= maxLength ? null : `${label}格式不正确`;

export const identifier = (label: string): Validator =>
  value => typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value) ? null : `${label}格式不正确`;

export const password = (label = '密码'): Validator =>
  value => typeof value === 'string' && value.length >= 6 && value.length <= 128 ? null : `${label}长度必须为6到128个字符`;
