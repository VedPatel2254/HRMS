import api from './axios';
import { ApiResponse } from '../types';

interface Project {
  id: string;
  name: string;
  description: string | null;
  clientId: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  priority: string;
  createdBy: string;
  createdAt: string;
  client?: { id: string; name: string } | null;
  members?: Array<{
    id: string;
    role: string;
    user: { id: string; firstName: string; lastName: string; profilePicture: string | null };
  }>;
  _count?: { tasks: number; members: number };
  taskStats?: Record<string, number>;
}

interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

export const getAllProjects = async (params?: {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ data: Project[]; total: number; page: number; limit: number; totalPages: number }>> => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const response = await api.get(`/projects?${queryParams.toString()}`);
  return response.data;
};

export const createProject = async (data: {
  name: string;
  description?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  priority?: string;
  memberIds?: string[];
}): Promise<ApiResponse<Project>> => {
  const response = await api.post<ApiResponse<Project>>('/projects', data);
  return response.data;
};

export const getProject = async (id: string): Promise<ApiResponse<Project>> => {
  const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
  return response.data;
};

export const updateProject = async (id: string, data: Partial<Project>): Promise<ApiResponse<Project>> => {
  const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
  return response.data;
};

export const archiveProject = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/projects/${id}`);
  return response.data;
};

export const addMember = async (projectId: string, userId: string, role?: string): Promise<ApiResponse<ProjectMember>> => {
  const response = await api.post<ApiResponse<ProjectMember>>(`/projects/${projectId}/members`, { userId, role });
  return response.data;
};

export const removeMember = async (projectId: string, userId: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

export const getProjectTasks = async (projectId: string): Promise<ApiResponse<Array<{
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: { id: string; firstName: string; lastName: string; profilePicture: string | null };
  _count: { comments: number };
}>>> => {
  const response = await api.get(`/projects/${projectId}/tasks`);
  return response.data;
};

export const getProjectStats = async (): Promise<ApiResponse<Array<{ status: string; count: number }>>> => {
  const response = await api.get('/projects/stats');
  return response.data;
};
