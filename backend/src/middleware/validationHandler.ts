import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Validation Error Handler Middleware
 * 
 * Checks for validation errors from express-validator
 * Returns formatted error response if validation fails
 */

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
    return;
  }

  next();
};
