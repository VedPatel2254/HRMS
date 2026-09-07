import api from './axios';

export const getMyExpenses = async () => {
  const { data } = await api.get('/expenses/my');
  return data;
};

export const createExpense = async (expenseData: {
  title: string;
  amount: number;
  category: string;
  receiptUrl?: string;
  date: string;
}) => {
  const { data } = await api.post('/expenses', expenseData);
  return data;
};

export const getAllExpenses = async (params?: {
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get('/expenses', { params });
  return data;
};

export const approveExpense = async (id: string, reviewerNote?: string) => {
  const { data } = await api.put(`/expenses/${id}/approve`, { reviewerNote });
  return data;
};

export const rejectExpense = async (id: string, reviewerNote?: string) => {
  const { data } = await api.put(`/expenses/${id}/reject`, { reviewerNote });
  return data;
};

export const markAsPaid = async (id: string) => {
  const { data } = await api.put(`/expenses/${id}/pay`);
  return data;
};
