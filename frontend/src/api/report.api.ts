import api from './axios';

export const getAttendanceReport = async (params?: { month?: number; year?: number }) => {
  const { data } = await api.get('/reports/attendance', { params });
  return data;
};

export const getPayrollReport = async (params?: { month?: number; year?: number }) => {
  const { data } = await api.get('/reports/payroll', { params });
  return data;
};

export const getLeaveReport = async (params?: { year?: number }) => {
  const { data } = await api.get('/reports/leave', { params });
  return data;
};

export const getHeadcountReport = async () => {
  const { data } = await api.get('/reports/headcount');
  return data;
};

export const getTaskReport = async () => {
  const { data } = await api.get('/reports/tasks');
  return data;
};

export const getProjectReport = async () => {
  const { data } = await api.get('/reports/projects');
  return data;
};
