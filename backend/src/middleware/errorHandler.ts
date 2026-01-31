import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface CustomError extends Error {
  statusCode?: number;
}

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const requestId = (req as any).requestId || randomUUID();
  const isServerError = statusCode >= 500;

  // Never leak internal errors to clients; log with requestId for traceability
  const clientMessage = isServerError ? 'Internal server error' : err.message || 'Bad request';

  console.error(
    JSON.stringify({
      level: 'error',
      requestId,
      path: req.originalUrl,
      method: req.method,
      statusCode,
      message: err.message,
      stack: err.stack
    })
  );

  res.status(statusCode).json({
    error: clientMessage,
    requestId
  });
};
