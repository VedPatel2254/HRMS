import api from './axios';
import { ApiResponse } from '../types';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  industry: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  gstin: string | null;
  website: string | null;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { projects: number };
  projects?: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    startDate: string | null;
    endDate: string | null;
    _count: { tasks: number; members: number };
  }>;
}

interface ClientStats {
  active: number;
  inactive: number;
  totalProjects: number;
  total: number;
}

export const getAllClients = async (params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ data: Client[]; total: number; page: number; limit: number; totalPages: number }>> => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const response = await api.get(`/clients?${queryParams.toString()}`);
  return response.data;
};

export const createClient = async (data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  gstin?: string;
  website?: string;
}): Promise<ApiResponse<Client>> => {
  const response = await api.post<ApiResponse<Client>>('/clients', data);
  return response.data;
};

export const getClient = async (id: string): Promise<ApiResponse<Client>> => {
  const response = await api.get<ApiResponse<Client>>(`/clients/${id}`);
  return response.data;
};

export const updateClient = async (id: string, data: Partial<Client>): Promise<ApiResponse<Client>> => {
  const response = await api.put<ApiResponse<Client>>(`/clients/${id}`, data);
  return response.data;
};

export const deactivateClient = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/clients/${id}`);
  return response.data;
};

export const getClientStats = async (): Promise<ApiResponse<ClientStats>> => {
  const response = await api.get<ApiResponse<ClientStats>>('/clients/stats');
  return response.data;
};
