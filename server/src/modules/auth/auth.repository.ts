import { prisma } from '../../database';

export type PrismaUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  refreshToken: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class AuthRepository {
  async findByEmail(email: string): Promise<PrismaUser | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    }) as Promise<PrismaUser | null>;
  }

  async findById(id: string): Promise<PrismaUser | null> {
    return prisma.user.findUnique({
      where: { id },
    }) as Promise<PrismaUser | null>;
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<PrismaUser> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
      },
    }) as Promise<PrismaUser>;
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken,
        lastLoginAt: refreshToken ? new Date() : undefined,
      },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }
}
