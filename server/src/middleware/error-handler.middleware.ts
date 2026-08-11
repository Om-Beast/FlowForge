import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { BaseError } from '../shared/errors';
import { ApiErrorResponse } from '../shared/types';
import { logger } from '../utils';
import { AuthenticatedRequest } from '../shared/types';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = (req as AuthenticatedRequest).requestId ?? 'unknown';
  const userId = (req as AuthenticatedRequest).user?.id;

  // Operational errors (known, expected)
  if (err instanceof BaseError && err.isOperational) {
    logger.warn('Operational error', {
      requestId,
      userId,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      metadata: err.metadata,
    });

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.metadata,
        requestId,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
        requestId,
      },
      timestamp: new Date().toISOString(),
    };
    res.status(422).json(response);
    return;
  }

  // Prisma known request errors
  if (err instanceof PrismaClientKnownRequestError) {
    let statusCode = 500;
    let message = 'Database error';
    let code = 'DATABASE_ERROR';

    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = `A record with this ${(err.meta?.['target'] as string[])?.join(', ')} already exists`;
        code = 'UNIQUE_CONSTRAINT_VIOLATION';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        code = 'NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint violation';
        code = 'FOREIGN_KEY_VIOLATION';
        break;
      default:
        logger.error('Unhandled Prisma error', { requestId, code: err.code, message: err.message });
    }

    res.status(statusCode).json({
      success: false,
      error: { code, message, requestId },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Unknown / programming errors
  logger.error('Unhandled error', {
    requestId,
    userId,
    error: err.message,
    stack: err.stack,
  });

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(response);
};
