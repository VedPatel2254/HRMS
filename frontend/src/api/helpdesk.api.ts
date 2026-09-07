import api from './axios';

export const getMyTickets = async () => {
  const { data } = await api.get('/tickets/my');
  return data;
};

export const createTicket = async (ticketData: {
  title: string;
  description: string;
  category: string;
  priority?: string;
}) => {
  const { data } = await api.post('/tickets', ticketData);
  return data;
};

export const getAllTickets = async (params?: {
  status?: string;
  category?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get('/tickets', { params });
  return data;
};

export const assignTicket = async (id: string, assignedTo: string) => {
  const { data } = await api.put(`/tickets/${id}/assign`, { assignedTo });
  return data;
};

export const resolveTicket = async (id: string, resolution?: string) => {
  const { data } = await api.put(`/tickets/${id}/resolve`, { resolution });
  return data;
};

export const closeTicket = async (id: string) => {
  const { data } = await api.put(`/tickets/${id}/close`);
  return data;
};
