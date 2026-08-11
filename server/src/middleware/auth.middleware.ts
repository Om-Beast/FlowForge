import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractBearerToken } from '../utils';
import { AuthenticatedRequest } from '../shared/types';
import { ApiError } from '../shared/errors';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const payload = verifyAccessToken(token);

    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as import('../shared/enums').UserRole,
      name: payload.name,
    };

    next();
  } catch (err) {
    next(err instanceof ApiError ? err : ApiError.unauthorized());
  }
};

export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();
    const token = extractBearerToken(authHeader);
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as import('../shared/enums').UserRole,
      name: payload.name,
    };
  } catch {
    // optional — do not block request
  }
  next();
};
