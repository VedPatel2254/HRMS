import api from './axios';

export const getAllAssets = async (params?: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get('/assets', { params });
  return data;
};

export const createAsset = async (assetData: {
  name: string;
  type: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  condition?: string;
  notes?: string;
}) => {
  const { data } = await api.post('/assets', assetData);
  return data;
};

export const updateAsset = async (
  id: string,
  assetData: {
    name?: string;
    type?: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    condition?: string;
    notes?: string;
    status?: string;
  }
) => {
  const { data } = await api.put(`/assets/${id}`, assetData);
  return data;
};

export const assignAsset = async (assetId: string, userId: string) => {
  const { data } = await api.post(`/assets/${assetId}/assign`, { userId });
  return data;
};

export const returnAsset = async (assetId: string) => {
  const { data } = await api.post(`/assets/${assetId}/return`);
  return data;
};

export const deleteAsset = async (assetId: string) => {
  await api.delete(`/assets/${assetId}`);
};
