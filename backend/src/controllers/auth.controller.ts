import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as authService from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response.utils';

export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      errorResponse(res, 'Email and password are required.', 400);
      return;
    }

    const result = await authService.login(email, password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      errorResponse(res, 'Refresh token not found.', 401);
      return;
    }

    const result = await authService.refreshTokens(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    successResponse(res, {
      accessToken: result.accessToken,
    }, 'Token refreshed successfully.');
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.id) {
      await authService.logout(req.user.id);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    successResponse(res, null, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      errorResponse(res, 'User not authenticated.', 401);
      return;
    }

    const user = await authService.getMe(req.user.id);
    successResponse(res, user, 'User profile retrieved.');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      errorResponse(res, 'User not authenticated.', 401);
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      errorResponse(res, 'Old password and new password are required.', 400);
      return;
    }

    if (newPassword.length < 8) {
      errorResponse(res, 'New password must be at least 8 characters.', 400);
      return;
    }

    await authService.changePassword(req.user.id, oldPassword, newPassword);
    successResponse(res, null, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      errorResponse(res, 'Email is required.', 400);
      return;
    }

    const resetToken = await authService.forgotPassword(email);

    if (resetToken) {
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    successResponse(
      res,
      null,
      'If the email exists, a password reset link has been sent.'
    );
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      errorResponse(res, 'Token and new password are required.', 400);
      return;
    }

    if (newPassword.length < 8) {
      errorResponse(res, 'New password must be at least 8 characters.', 400);
      return;
    }

    await authService.resetPassword(token, newPassword);
    successResponse(res, null, 'Password reset successful. Please login with your new password.');
  } catch (error) {
    next(error);
  }
};
