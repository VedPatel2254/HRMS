import api from './axios';
import { ApiResponse } from '../types';

interface LeaveType {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
  isPaid: boolean;
  carryForward: boolean;
  maxCarryForward: number;
  description: string | null;
}

interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  remaining: number;
  leaveType: {
    name: string;
    code: string;
  };
}

interface LeaveRequest {
  id: string;
  userId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewerNote: string | null;
  createdAt: string;
  leaveType: {
    name: string;
    code: string;
  };
  user?: {
    employeeId: string;
    firstName: string;
    lastName: string;
  };
}

interface TeamLeaveBalance {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  balances: Array<{
    leaveType: string;
    code: string;
    allocated: number;
    used: number;
    remaining: number;
  }>;
}

export const getLeaveTypes = async (): Promise<ApiResponse<LeaveType[]>> => {
  const response = await api.get<ApiResponse<LeaveType[]>>('/leaves/types');
  return response.data;
};

export const createLeaveType = async (data: {
  name: string;
  code: string;
  defaultDays: number;
  isPaid?: boolean;
  carryForward?: boolean;
  maxCarryForward?: number;
  description?: string;
}): Promise<ApiResponse<LeaveType>> => {
  const response = await api.post<ApiResponse<LeaveType>>('/leaves/types', data);
  return response.data;
};

export const getMyLeaveBalance = async (year?: number): Promise<ApiResponse<LeaveBalance[]>> => {
  const params = year ? `?year=${year}` : '';
  const response = await api.get<ApiResponse<LeaveBalance[]>>(`/leaves/balance${params}`);
  return response.data;
};

export const getUserLeaveBalance = async (userId: string, year?: number): Promise<ApiResponse<LeaveBalance[]>> => {
  const params = year ? `?year=${year}` : '';
  const response = await api.get<ApiResponse<LeaveBalance[]>>(`/leaves/balance/${userId}${params}`);
  return response.data;
};

export const getTeamLeaveBalance = async (year?: number): Promise<ApiResponse<TeamLeaveBalance[]>> => {
  const params = year ? `?year=${year}` : '';
  const response = await api.get<ApiResponse<TeamLeaveBalance[]>>(`/leaves/balance/team${params}`);
  return response.data;
};

export const applyLeave = async (data: {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  reason: string;
}): Promise<ApiResponse<LeaveRequest>> => {
  const response = await api.post<ApiResponse<LeaveRequest>>('/leaves/apply', data);
  return response.data;
};

export const getMyLeaveRequests = async (params?: {
  status?: string;
  leaveTypeId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ data: LeaveRequest[]; total: number; page: number; limit: number; totalPages: number }>> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.leaveTypeId) queryParams.append('leaveTypeId', params.leaveTypeId);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const response = await api.get(`/leaves/my?${queryParams.toString()}`);
  return response.data;
};

export const getAllLeaveRequests = async (params?: {
  status?: string;
  leaveTypeId?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ data: LeaveRequest[]; total: number; page: number; limit: number; totalPages: number }>> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.leaveTypeId) queryParams.append('leaveTypeId', params.leaveTypeId);
  if (params?.userId) queryParams.append('userId', params.userId);
  if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params?.toDate) queryParams.append('toDate', params.toDate);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const response = await api.get(`/leaves?${queryParams.toString()}`);
  return response.data;
};

export const approveLeave = async (id: string, note?: string): Promise<ApiResponse<LeaveRequest>> => {
  const response = await api.put<ApiResponse<LeaveRequest>>(`/leaves/${id}/approve`, { note });
  return response.data;
};

export const rejectLeave = async (id: string, note: string): Promise<ApiResponse<LeaveRequest>> => {
  const response = await api.put<ApiResponse<LeaveRequest>>(`/leaves/${id}/reject`, { note });
  return response.data;
};

export const cancelLeave = async (id: string): Promise<ApiResponse<LeaveRequest>> => {
  const response = await api.put<ApiResponse<LeaveRequest>>(`/leaves/${id}/cancel`);
  return response.data;
};

export const getTeamLeaveCalendar = async (month: number, year: number): Promise<ApiResponse<LeaveRequest[]>> => {
  const response = await api.get<ApiResponse<LeaveRequest[]>>(`/leaves/calendar?month=${month}&year=${year}`);
  return response.data;
};
