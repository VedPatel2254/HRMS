import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAssets = async (query?: {
  status?: string;
  type?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query?.page || 1;
  const limit = query?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query?.status) where.status = query.status;
  if (query?.type) where.type = query.type;
  if (query?.assignedTo) where.assignedTo = query.assignedTo;

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.asset.count({ where }),
  ]);

  return {
    data: assets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const createAsset = async (data: {
  name: string;
  type: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  condition?: string;
  notes?: string;
}) => {
  return prisma.asset.create({
    data: {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      status: 'AVAILABLE',
    },
  });
};

export const updateAsset = async (
  id: string,
  data: {
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
  return prisma.asset.update({
    where: { id },
    data: {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
    },
  });
};

export const assignAsset = async (assetId: string, userId: string) => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Asset not found.');
  if (asset.status === 'ASSIGNED') throw new Error('Asset is already assigned.');

  return prisma.asset.update({
    where: { id: assetId },
    data: {
      assignedTo: userId,
      assignedAt: new Date(),
      status: 'ASSIGNED',
    },
  });
};

export const returnAsset = async (assetId: string) => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Asset not found.');
  if (asset.status !== 'ASSIGNED') throw new Error('Asset is not currently assigned.');

  return prisma.asset.update({
    where: { id: assetId },
    data: {
      assignedTo: null,
      assignedAt: null,
      status: 'AVAILABLE',
    },
  });
};
