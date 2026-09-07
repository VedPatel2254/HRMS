import { Response } from 'express';

interface SuccessResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: unknown;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string = 'Error occurred',
  statusCode: number = 400,
  errors?: unknown
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
  };
  if (errors !== undefined) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};
