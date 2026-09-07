import api from './axios';
import { ApiResponse, PaginatedResponse, User } from '../types';

interface EmployeeStats {
  totalActive: number;
  totalInactive: number;
  totalInterns: number;
  totalHR: number;
  totalAdmin: number;
  newThisMonth: number;
}

interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

interface EmployeeListResponse extends PaginatedResponse<User> {}

export const getAllEmployees = async (
  params: EmployeeListParams = {}
): Promise<ApiResponse<EmployeeListResponse>> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', String(params.page));
  if (params.limit) queryParams.append('limit', String(params.limit));
  if (params.search) queryParams.append('search', params.search);
  if (params.role) queryParams.append('role', params.role);
  if (params.status) queryParams.append('status', params.status);

  const response = await api.get<ApiResponse<EmployeeListResponse>>(
    `/employees?${queryParams.toString()}`
  );
  return response.data;
};

export const createEmployee = async (
  data: Record<string, unknown>
): Promise<ApiResponse<{ user: User; tempPassword: string }>> => {
  const response = await api.post<ApiResponse<{ user: User; tempPassword: string }>>(
    '/employees',
    data
  );
  return response.data;
};

export const getEmployee = async (
  id: string
): Promise<ApiResponse<User>> => {
  const response = await api.get<ApiResponse<User>>(`/employees/${id}`);
  return response.data;
};

export const updateEmployee = async (
  id: string,
  data: Record<string, unknown>
): Promise<ApiResponse<User>> => {
  const response = await api.put<ApiResponse<User>>(`/employees/${id}`, data);
  return response.data;
};

export const deactivateEmployee = async (
  id: string
): Promise<ApiResponse<{ message: string }>> => {
  const response = await api.delete<ApiResponse<{ message: string }>>(
    `/employees/${id}`
  );
  return response.data;
};

export const uploadDocument = async (
  id: string,
  file: File
): Promise<ApiResponse<{ fileName: string; originalName: string; path: string }>> => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await api.post<ApiResponse<{ fileName: string; originalName: string; path: string }>>(
    `/employees/${id}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const getDocuments = async (
  id: string
): Promise<ApiResponse<Array<{ fileName: string; originalName: string; path: string; size: number; uploadedAt: string }>>> => {
  const response = await api.get(`/employees/${id}/documents`);
  return response.data;
};

export const deleteDocument = async (
  id: string,
  fileName: string
): Promise<ApiResponse<{ message: string }>> => {
  const response = await api.delete<ApiResponse<{ message: string }>>(
    `/employees/${id}/documents/${fileName}`
  );
  return response.data;
};

export const getEmployeeStats = async (): Promise<ApiResponse<EmployeeStats>> => {
  const response = await api.get<ApiResponse<EmployeeStats>>('/employees/stats');
  return response.data;
};
