import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

// Error codes
export const ErrorCodes = {
  AUTH_UNAUTHORIZED: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_003',
  VALIDATION_ERROR: 'VAL_001',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INT_001',
};

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let apiError: ApiError;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  if (error instanceof AppError) {
    // Custom application errors
    statusCode = error.statusCode;
    apiError = {
      code: error.code as ErrorCodes,
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };
  } else if (error instanceof ZodError) {
    // Validation errors
    statusCode = 400;
    apiError = {
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed',
      details: error.errors,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Database errors
    statusCode = 400;
    let message = 'Database operation failed';
    let code = ErrorCodes.DATABASE_ERROR;

    switch (error.code) {
      case 'P2002':
        message = 'A record with this information already exists';
        break;
      case 'P2025':
        message = 'Record not found';
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        break;
      default:
        message = 'Database operation failed';
    }

    apiError = {
      code,
      message,
      details: process.env.NODE_ENV === 'development' ? error.meta : undefined,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    // Prisma validation errors
    statusCode = 400;
    apiError = {
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Invalid data provided',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };
  } else {
    // Generic server errors
    apiError = {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };
  }

  res.status(statusCode).json({
    success: false,
    error: apiError,
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  const apiError = {
    code: ErrorCodes.NOT_FOUND,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string,
  };

  res.status(404).json({
    success: false,
    error: apiError,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};