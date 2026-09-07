import api from './axios';

export const getCompanySettings = async () => {
  const { data } = await api.get('/settings/company');
  return data.data;
};

export const updateCompanySettings = async (settings: {
  companyName?: string;
  address?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  financialYearStart?: number;
}) => {
  const { data } = await api.put('/settings/company', settings);
  return data.data;
};

export const getHolidays = async (year?: number) => {
  const params = year ? `?year=${year}` : '';
  const { data } = await api.get(`/settings/holidays${params}`);
  return data.data;
};

export const createHoliday = async (holiday: {
  name: string;
  date: string;
  type: string;
}) => {
  const { data } = await api.post('/settings/holidays', holiday);
  return data.data;
};

export const updateHoliday = async (id: string, holiday: {
  name?: string;
  date?: string;
  type?: string;
}) => {
  const { data } = await api.put(`/settings/holidays/${id}`, holiday);
  return data.data;
};

export const deleteHoliday = async (id: string) => {
  await api.delete(`/settings/holidays/${id}`);
};

export const getAllUsers = async (params?: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.role) queryParams.append('role', params.role);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  const { data } = await api.get(`/settings/users?${queryParams.toString()}`);
  return data.data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const { data } = await api.put(`/settings/users/${userId}/role`, { role });
  return data.data;
};

export const deactivateUser = async (userId: string) => {
  const { data } = await api.put(`/settings/users/${userId}/deactivate`);
  return data.data;
};

export const resetUserPassword = async (userId: string) => {
  const { data } = await api.post(`/settings/users/${userId}/reset-password`);
  return data.data;
};

export const getAuditLogs = async (params?: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entity?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.userId) queryParams.append('userId', params.userId);
  if (params?.action) queryParams.append('action', params.action);
  if (params?.entity) queryParams.append('entity', params.entity);
  if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params?.toDate) queryParams.append('toDate', params.toDate);
  const { data } = await api.get(`/settings/audit-logs?${queryParams.toString()}`);
  return data.data;
};
