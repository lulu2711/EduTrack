import mongoose from 'mongoose';

export type DataSourceMode = 'fallback' | 'mongodb';
export const getDataSourceMode = (): DataSourceMode => process.env.DATA_SOURCE_MODE === 'mongodb' ? 'mongodb' : 'fallback';
export const isStrictMongoMode = () => getDataSourceMode() === 'mongodb';
export const getDataSourceStatus = () => {
  const connected = mongoose.connection.readyState === 1;
  return { mode: getDataSourceMode(), database: connected ? 'connected' : 'disconnected', dataSource: connected ? 'mongodb' : (isStrictMongoMode() ? 'none' : 'json-fallback'), fallbackEnabled: !isStrictMongoMode() };
};
export class DataSourceUnavailableError extends Error { statusCode = 503; code = 'DATA_SOURCE_UNAVAILABLE'; }
export function requireMongoConnection() { if (isStrictMongoMode() && mongoose.connection.readyState !== 1) throw new DataSourceUnavailableError('MongoDB 当前不可用，严格模式已阻止 JSON 回退'); }

export function sendUnavailable(res: import('express').Response, error: unknown, message: string): void {
  if (error instanceof DataSourceUnavailableError || (isStrictMongoMode() && mongoose.connection.readyState !== 1)) {
    res.status(503).json({ success: false, error: { code: 'DATA_SOURCE_UNAVAILABLE', message: '数据库当前不可用' } });
    return;
  }
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
}

export function fail(
  res: import('express').Response,
  status: number,
  code: string,
  message: string,
  details: unknown[] = [],
): void {
  res.status(status).json({ success: false, error: { code, message, details } });
}

export function sendError(
  res: import('express').Response,
  status: number,
  code: string,
  message: string,
  details: unknown[] = [],
): void {
  fail(res, status, code, message, details);
}
