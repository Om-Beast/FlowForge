import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authConfig } from '../config';
import { JwtPayload, RefreshTokenPayload, TokenPair } from '../shared/types';
import { ApiError } from '../shared/errors';
import { UserRole } from '../shared/enums';

export interface TokenUserPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export const generateTokenPair = (user: TokenUserPayload): TokenPair => {
  const jti = uuidv4();

  const accessPayload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    jti,
  };

  const refreshPayload: RefreshTokenPayload = {
    sub: user.id,
    jti,
  };

  const accessToken = jwt.sign(accessPayload, authConfig.jwt.accessSecret, {
    expiresIn: authConfig.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });

  const refreshToken = jwt.sign(refreshPayload, authConfig.jwt.refreshSecret, {
    expiresIn: authConfig.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });

  const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
  const expiresIn = (decoded.exp ?? 0) - Math.floor(Date.now() / 1000);

  return { accessToken, refreshToken, expiresIn };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, authConfig.jwt.accessSecret, {
      algorithms: ['HS256'],
    }) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Access token expired', 'TOKEN_EXPIRED');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid access token', 'TOKEN_INVALID');
    }
    throw ApiError.unauthorized('Token verification failed');
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, authConfig.jwt.refreshSecret, {
      algorithms: ['HS256'],
    }) as RefreshTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid refresh token', 'REFRESH_TOKEN_INVALID');
  }
};

export const extractBearerToken = (authHeader?: string): string => {
  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }
  const token = authHeader.substring(7).trim();
  if (!token) throw ApiError.unauthorized('Empty bearer token');
  return token;
};
