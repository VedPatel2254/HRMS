import api from './axios';
import { ApiResponse, LoginResponse, User } from '../types';

export const login = async (
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> => {
  const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
    email,
    password,
  });
  return response.data;
};

export const logout = async (): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>('/auth/logout');
  return response.data;
};

export const getMe = async (): Promise<ApiResponse<User>> => {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data;
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>('/auth/change-password', {
    oldPassword,
    newPassword,
  });
  return response.data;
};

export const forgotPassword = async (
  email: string
): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>('/auth/forgot-password', {
    email,
  });
  return response.data;
};

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<ApiResponse<null>> => {
  const response = await api.post<ApiResponse<null>>(
    `/auth/reset-password/${token}`,
    { newPassword }
  );
  return response.data;
};

export const refreshToken = async (): Promise<
  ApiResponse<{ accessToken: string }>
> => {
  const response = await api.post<ApiResponse<{ accessToken: string }>>(
    '/auth/refresh'
  );
  return response.data;
};
