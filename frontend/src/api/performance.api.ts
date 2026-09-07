import api from './axios';

export const getMyGoals = async () => {
  const { data } = await api.get('/performance/goals/my');
  return data;
};

export const createGoal = async (goalData: {
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  weight?: number;
}) => {
  const { data } = await api.post('/performance/goals', goalData);
  return data;
};

export const updateGoal = async (
  id: string,
  goalData: {
    title?: string;
    description?: string;
    targetDate?: string;
    weight?: number;
    status?: string;
  }
) => {
  const { data } = await api.put(`/performance/goals/${id}`, goalData);
  return data;
};

export const deleteGoal = async (id: string) => {
  await api.delete(`/performance/goals/${id}`);
};

export const getAllGoals = async (params?: { userId?: string }) => {
  const { data } = await api.get('/performance/goals', { params });
  return data;
};

export const getMyReviews = async () => {
  const { data } = await api.get('/performance/reviews/my');
  return data;
};

export const getAllReviews = async (params?: {
  period?: string;
  year?: number;
  status?: string;
}) => {
  const { data } = await api.get('/performance/reviews', { params });
  return data;
};

export const startReviewCycle = async (cycleData: {
  userIds: string[];
  period: string;
  year: number;
}) => {
  const { data } = await api.post('/performance/reviews', cycleData);
  return data;
};

export const submitSelfRating = async (
  id: string,
  ratingData: {
    selfRating: number;
    selfComments?: string;
  }
) => {
  const { data } = await api.put(`/performance/reviews/${id}/self`, ratingData);
  return data;
};

export const submitManagerRating = async (
  id: string,
  ratingData: {
    managerRating: number;
    managerComments?: string;
  }
) => {
  const { data } = await api.put(`/performance/reviews/${id}/manager`, ratingData);
  return data;
};
