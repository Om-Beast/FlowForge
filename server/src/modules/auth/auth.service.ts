import { AuthRepository, PrismaUser } from './auth.repository';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthTokenResponse,
  UserProfile,
} from './auth.types';
import {
  hashPassword,
  comparePassword,
  generateTokenPair,
  verifyRefreshToken,
  logger,
} from '../../utils';
import { ApiError } from '../../shared/errors';
import { UserRole } from '../../shared/enums';

const mapUserToProfile = (user: PrismaUser): UserProfile => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role as UserRole,
  createdAt: user.createdAt,
});

export class AuthService {
  private readonly repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
  }

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const exists = await this.repo.existsByEmail(dto.email);
    if (exists) {
      throw ApiError.conflict(
        'An account with this email already exists',
        'EMAIL_ALREADY_REGISTERED',
        { email: dto.email },
      );
    }

    const hashedPassword = await hashPassword(dto.password);
    const user = await this.repo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
    });

    await this.repo.updateRefreshToken(user.id, tokens.refreshToken);
    logger.info('User registered', { userId: user.id, email: user.email });

    return { user: mapUserToProfile(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
    });

    await this.repo.updateRefreshToken(user.id, tokens.refreshToken);
    logger.info('User logged in', { userId: user.id, email: user.email });

    return { user: mapUserToProfile(user), ...tokens };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokenResponse> {
    const payload = verifyRefreshToken(dto.refreshToken);
    const user = await this.repo.findById(payload.sub);

    if (!user || user.refreshToken !== dto.refreshToken) {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
    }

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
    });

    await this.repo.updateRefreshToken(user.id, tokens.refreshToken);
    return { user: mapUserToProfile(user), ...tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.repo.updateRefreshToken(userId, null);
    logger.info('User logged out', { userId });
  }

  async getMe(userId: string): Promise<UserProfile> {
    const user = await this.repo.findById(userId);
    if (!user) throw ApiError.notFound('User', userId);
    return mapUserToProfile(user);
  }
}
