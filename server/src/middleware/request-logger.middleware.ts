import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils';
import { AuthenticatedRequest } from '../shared/types';
import { REQUEST_ID_HEADER, CORRELATION_ID_HEADER } from '../shared/constants';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = (req.headers[REQUEST_ID_HEADER.toLowerCase()] as string) ?? uuidv4();
  const correlationId = (req.headers[CORRELATION_ID_HEADER.toLowerCase()] as string) ?? requestId;
  const startTime = Date.now();

  (req as AuthenticatedRequest).requestId = requestId;
  (req as AuthenticatedRequest).correlationId = correlationId;
  (req as AuthenticatedRequest).startTime = startTime;

  res.setHeader(REQUEST_ID_HEADER, requestId);
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  const childLogger = logger.child({
    requestId,
    correlationId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  childLogger.http('Incoming request');

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logPayload = {
      requestId,
      correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: (req as AuthenticatedRequest).user?.id,
    };

    if (res.statusCode >= 500) {
      childLogger.error('Request failed with server error', logPayload);
    } else if (res.statusCode >= 400) {
      childLogger.warn('Request completed with client error', logPayload);
    } else {
      childLogger.http('Request completed', logPayload);
    }
  });

  next();
};
