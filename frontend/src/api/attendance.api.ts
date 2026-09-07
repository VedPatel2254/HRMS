import api from './axios';
import { ApiResponse } from '../types';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  punchInLat: number | null;
  punchInLong: number | null;
  punchOutLat: number | null;
  punchOutLong: number | null;
  punchInIP: string | null;
  punchOutIP: string | null;
  workingHours: number | null;
  status: string;
  notes: string | null;
  isManualEntry: boolean;
  user?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
}

interface AttendanceSummary {
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  weekends: number;
  holidays: number;
  attendancePercentage: number;
}

interface AttendanceStats {
  present: number;
  absent: number;
  onLeave: number;
  total: number;
}

interface DayRecord {
  date: string;
  status: string;
  punchIn: string | null;
  punchOut: string | null;
  workingHours: number | null;
  isHoliday: boolean;
  holidayName?: string;
}

export const punchIn = async (
  lat?: number,
  long?: number
): Promise<ApiResponse<AttendanceRecord>> => {
  const response = await api.post<ApiResponse<AttendanceRecord>>('/attendance/punch-in', {
    lat,
    long,
  });
  return response.data;
};

export const punchOut = async (
  lat?: number,
  long?: number
): Promise<ApiResponse<AttendanceRecord>> => {
  const response = await api.post<ApiResponse<AttendanceRecord>>('/attendance/punch-out', {
    lat,
    long,
  });
  return response.data;
};

export const getTodayAttendance = async (): Promise<ApiResponse<AttendanceRecord | null>> => {
  const response = await api.get<ApiResponse<AttendanceRecord | null>>('/attendance/today');
  return response.data;
};

export const getMyAttendance = async (
  month: number,
  year: number
): Promise<ApiResponse<DayRecord[]>> => {
  const response = await api.get<ApiResponse<DayRecord[]>>(
    `/attendance/my?month=${month}&year=${year}`
  );
  return response.data;
};

export const getMySummary = async (
  month: number,
  year: number
): Promise<ApiResponse<AttendanceSummary>> => {
  const response = await api.get<ApiResponse<AttendanceSummary>>(
    `/attendance/my/summary?month=${month}&year=${year}`
  );
  return response.data;
};

export const getAllAttendance = async (params: {
  date?: string;
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ data: AttendanceRecord[]; total: number; page: number; limit: number; totalPages: number }>> => {
  const queryParams = new URLSearchParams();
  if (params.date) queryParams.append('date', params.date);
  if (params.userId) queryParams.append('userId', params.userId);
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', String(params.page));
  if (params.limit) queryParams.append('limit', String(params.limit));

  const response = await api.get(`/attendance?${queryParams.toString()}`);
  return response.data;
};

export const getUserAttendance = async (
  userId: string,
  month: number,
  year: number
): Promise<ApiResponse<DayRecord[]>> => {
  const response = await api.get<ApiResponse<DayRecord[]>>(
    `/attendance/${userId}?month=${month}&year=${year}`
  );
  return response.data;
};

export const getAttendanceStats = async (): Promise<ApiResponse<AttendanceStats>> => {
  const response = await api.get<ApiResponse<AttendanceStats>>('/attendance/stats/today');
  return response.data;
};

export const manualAttendanceEntry = async (data: {
  userId: string;
  date: string;
  status: string;
  punchIn?: string;
  punchOut?: string;
  notes?: string;
}): Promise<ApiResponse<AttendanceRecord>> => {
  const response = await api.post<ApiResponse<AttendanceRecord>>('/attendance/manual', data);
  return response.data;
};
