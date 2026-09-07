import api from './axios';

export const getAnnouncements = async () => {
  const { data } = await api.get('/announcements');
  return data;
};

export const createAnnouncement = async (announcementData: {
  title: string;
  content: string;
  priority?: string;
  targetRoles?: string[];
  expiresAt?: string;
}) => {
  const { data } = await api.post('/announcements', announcementData);
  return data;
};

export const updateAnnouncement = async (
  id: string,
  announcementData: {
    title?: string;
    content?: string;
    priority?: string;
    targetRoles?: string[];
    expiresAt?: string;
  }
) => {
  const { data } = await api.put(`/announcements/${id}`, announcementData);
  return data;
};

export const deleteAnnouncement = async (id: string) => {
  await api.delete(`/announcements/${id}`);
};
