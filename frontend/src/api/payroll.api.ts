import api from './axios';
import { ApiResponse } from '../types';

interface Payslip {
  id: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  travelAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
  bonus: number;
  lossOfPay: number;
  otherDeductions: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  tds: number;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  paymentStatus: string;
  paidAt: string | null;
  workingDays: number;
  presentDays: number;
  createdAt: string;
  user?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    designation: string;
    bankAccountNumber: string | null;
  };
}

export const getMyPayslips = async (): Promise<ApiResponse<Payslip[]>> => {
  const response = await api.get<ApiResponse<Payslip[]>>('/payroll/my');
  return response.data;
};

export const getMyPayslipDetail = async (
  month: number,
  year: number
): Promise<ApiResponse<Payslip>> => {
  const response = await api.get<ApiResponse<Payslip>>(`/payroll/my/${month}/${year}`);
  return response.data;
};

export const getAllPayroll = async (params?: {
  month?: number;
  year?: number;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ data: Payslip[]; total: number; page: number; limit: number; totalPages: number }>> => {
  const queryParams = new URLSearchParams();
  if (params?.month) queryParams.append('month', String(params.month));
  if (params?.year) queryParams.append('year', String(params.year));
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const response = await api.get(`/payroll?${queryParams.toString()}`);
  return response.data;
};

export const generatePayroll = async (month: number, year: number): Promise<ApiResponse<{ generated: number; skipped: number }>> => {
  const response = await api.post<ApiResponse<{ generated: number; skipped: number }>>('/payroll/generate', { month, year });
  return response.data;
};

export const markAsPaid = async (id: string): Promise<ApiResponse<Payslip>> => {
  const response = await api.put<ApiResponse<Payslip>>(`/payroll/${id}/mark-paid`);
  return response.data;
};

export const addBonus = async (id: string, bonusAmount: number): Promise<ApiResponse<Payslip>> => {
  const response = await api.post<ApiResponse<Payslip>>(`/payroll/${id}/bonus`, { bonusAmount });
  return response.data;
};

export const deletePayroll = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/payroll/${id}`);
  return response.data;
};

export const getUserPayslip = async (
  userId: string,
  month: number,
  year: number
): Promise<ApiResponse<Payslip>> => {
  const response = await api.get<ApiResponse<Payslip>>(`/payroll/${userId}/${month}/${year}`);
  return response.data;
};
