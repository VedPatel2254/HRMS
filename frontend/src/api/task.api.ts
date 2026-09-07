import api from './axios';
import { ApiResponse } from '../types';

interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  assignedTo: string;
  assignedBy: string;
  priority: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  createdAt: string;
  assignee: { id: string; firstName: string; lastName: string; profilePicture: string | null };
  assigner: { id: string; firstName: string; lastName: string };
  project: { id: string; name: string } | null;
  comments?: TaskComment[];
  _count?: { comments: number };
}

interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; profilePicture: string | null };
}

interface TaskStats {
  status: string;
  count: number;
}

export const getAllTasks = async (params?: {
  status?: string;
  priority?: string;
  projectId?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ data: Task[]; total: number; page: number; limit: number; totalPages: number }>> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.projectId) queryParams.append('projectId', params.projectId);
  if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const response = await api.get(`/tasks?${queryParams.toString()}`);
  return response.data;
};

export const createTask = async (data: {
  title: string;
  description?: string;
  projectId?: string;
  assignedTo: string | string[];
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  status?: string;
}): Promise<ApiResponse<Task>> => {
  const response = await api.post<ApiResponse<Task>>('/tasks', data);
  return response.data;
};

export const getTask = async (id: string): Promise<ApiResponse<Task>> => {
  const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
  return response.data;
};

export const updateTask = async (id: string, data: {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  estimatedHours?: number;
  actualHours?: number;
}): Promise<ApiResponse<Task>> => {
  const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/tasks/${id}`);
  return response.data;
};

export const updateTaskStatus = async (id: string, status: string): Promise<ApiResponse<Task>> => {
  const response = await api.put<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
  return response.data;
};

export const addComment = async (taskId: string, content: string): Promise<ApiResponse<TaskComment>> => {
  const response = await api.post<ApiResponse<TaskComment>>(`/tasks/${taskId}/comments`, { content });
  return response.data;
};

export const getComments = async (taskId: string): Promise<ApiResponse<TaskComment[]>> => {
  const response = await api.get<ApiResponse<TaskComment[]>>(`/tasks/${taskId}/comments`);
  return response.data;
};

export const getTaskStats = async (): Promise<ApiResponse<TaskStats[]>> => {
  const response = await api.get<ApiResponse<TaskStats[]>>('/tasks/stats');
  return response.data;
};

export const uploadAttachment = async (taskId: string, formData: FormData) => {
  const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAttachments = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}/attachments`);
  return response.data;
};

export const deleteAttachment = async (taskId: string, attachmentId: string) => {
  const response = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  return response.data;
};

export const getPhases = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}/phases`);
  return response.data;
};

export const createPhase = async (taskId: string, data: { title: string; description?: string }) => {
  const response = await api.post(`/tasks/${taskId}/phases`, data);
  return response.data;
};

export const updatePhase = async (taskId: string, phaseId: string, data: { title?: string; description?: string; status?: string; order?: number }) => {
  const response = await api.put(`/tasks/${taskId}/phases/${phaseId}`, data);
  return response.data;
};

export const deletePhase = async (taskId: string, phaseId: string) => {
  const response = await api.delete(`/tasks/${taskId}/phases/${phaseId}`);
  return response.data;
};
