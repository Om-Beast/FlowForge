import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../shared/enums';
import { ApiError } from '../shared/errors';
import { AuthenticatedRequest } from '../shared/types';

/**
 * Role-Based Access Control middleware.
 * Must be used AFTER authenticate middleware.
 */
export const authorize =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      next(
        ApiError.forbidden(
          `Role '${user.role}' is not permitted to access this resource`,
          'INSUFFICIENT_ROLE',
          { required: allowedRoles, current: user.role },
        ),
      );
      return;
    }

    next();
  };

/**
 * Ensures the authenticated user can only access their own resources,
 * unless they are an ADMIN.
 */
export const authorizeOwnerOrAdmin =
  (getUserId: (req: Request) => string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      next(ApiError.unauthorized());
      return;
    }

    if (user.role === UserRole.ADMIN) {
      return next();
    }

    const resourceUserId = getUserId(req);
    if (user.id !== resourceUserId) {
      next(ApiError.forbidden('You do not have access to this resource'));
      return;
    }

    next();
  };
