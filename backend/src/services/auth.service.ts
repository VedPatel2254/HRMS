import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.utils';

const prisma = new PrismaClient();

interface AuthResult {
  user: Omit<User, 'passwordHash' | 'refreshToken' | 'passwordResetToken' | 'passwordResetExpiry'>;
  accessToken: string;
  refreshToken: string;
}

const excludeSensitiveFields = (user: User) => {
  const { passwordHash, refreshToken, passwordResetToken, passwordResetExpiry, ...safeUser } = user;
  return safeUser;
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { salaryStructure: true },
  });

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Account is not active. Please contact administrator.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    user: excludeSensitiveFields(user),
    accessToken,
    refreshToken,
  };
};

export const refreshTokens = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const decoded = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user || !user.refreshToken) {
    throw new Error('Invalid refresh token.');
  }

  if (user.refreshToken !== refreshToken) {
    throw new Error('Refresh token mismatch. Please login again.');
  }

  const newAccessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const newRefreshToken = generateRefreshToken({
    id: user.id,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};

export const getMe = async (
  userId: string
): Promise<Omit<User, 'passwordHash' | 'refreshToken' | 'passwordResetToken' | 'passwordResetExpiry'>> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { salaryStructure: true },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  return excludeSensitiveFields(user);
};

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isOldPasswordValid) {
    throw new Error('Current password is incorrect.');
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHashedPassword,
      refreshToken: null,
    },
  });
};

export const forgotPassword = async (email: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpiry: expiry,
    },
  });

  return resetToken;
};

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token.');
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshToken: null,
    },
  });
};
