import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendCreated } from '../../utils';
import { AuthenticatedRequest } from '../../shared/types';
import { HTTP_STATUS } from '../../shared/constants';

export class AuthController {
  private readonly service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const result = await this.service.register(req.body);
    sendCreated(res, result, 'Account created successfully', (req as AuthenticatedRequest).requestId);
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const result = await this.service.login(req.body);
    sendSuccess(res, result, {
      message: 'Login successful',
      statusCode: HTTP_STATUS.OK,
      requestId: (req as AuthenticatedRequest).requestId,
    });
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    const result = await this.service.refreshToken(req.body);
    sendSuccess(res, result, {
      message: 'Token refreshed',
      requestId: (req as AuthenticatedRequest).requestId,
    });
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const user = (req as AuthenticatedRequest).user;
    await this.service.logout(user.id);
    sendSuccess(res, null, {
      message: 'Logged out successfully',
      requestId: (req as AuthenticatedRequest).requestId,
    });
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    const user = (req as AuthenticatedRequest).user;
    const profile = await this.service.getMe(user.id);
    sendSuccess(res, profile, {
      requestId: (req as AuthenticatedRequest).requestId,
    });
  }

  async updateProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const user = (req as AuthenticatedRequest).user;
    const { name, email } = req.body as { name?: string; email?: string };
    const profile = await this.service.updateProfile(user.id, { name, email });
    sendSuccess(res, profile, { message: 'Profile updated' });
  }

  async changePassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const user = (req as AuthenticatedRequest).user;
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await this.service.changePassword(user.id, currentPassword, newPassword);
    sendSuccess(res, null, { message: 'Password changed successfully' });
  }
}

