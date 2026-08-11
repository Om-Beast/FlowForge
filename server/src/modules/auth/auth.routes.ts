import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateBody } from '../../middleware';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth.schema';
import { strictRateLimiter, authenticate } from '../../middleware';
import { asyncHandler } from '../../utils';

const router = Router();
const controller = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post(
  '/register',
  strictRateLimiter,
  validateBody(registerSchema),
  asyncHandler(controller.register.bind(controller)),
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token pair
 * @access  Public
 */
router.post(
  '/login',
  strictRateLimiter,
  validateBody(loginSchema),
  asyncHandler(controller.login.bind(controller)),
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Exchange refresh token for new token pair
 * @access  Public
 */
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  asyncHandler(controller.refreshToken.bind(controller)),
);

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate refresh token
 * @access  Protected
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(controller.logout.bind(controller)),
);

/**
 * @route   GET /api/auth/me
 * @desc    Get authenticated user profile
 * @access  Protected
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(controller.me.bind(controller)),
);

export { router as authRoutes };
