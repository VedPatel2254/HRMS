import { PrismaClient, ClientStatus } from '@prisma/client';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

export const getAllClients = async (query: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }
  if (query.status) {
    where.status = query.status as ClientStatus;
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return {
    data: clients,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const createClient = async (
  data: {
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
  },
  createdBy: string
) => {
  const client = await prisma.client.create({
    data: {
      ...data,
      createdBy,
    },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    if (hr.id !== createdBy) {
      await notificationService.sendNotification({
        userId: hr.id,
        title: 'New Client Added',
        message: `${client.user.firstName} ${client.user.lastName} added client "${client.name}"`,
        type: 'CLIENT',
        link: '/clients',
      });
    }
  }

  return client;
};

export const getClient = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          startDate: true,
          endDate: true,
          _count: { select: { tasks: true, members: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!client) throw new Error('Client not found.');
  return client;
};

export const updateClient = async (
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    industry?: string;
    contactPersonName?: string;
    contactPersonEmail?: string;
    contactPersonPhone?: string;
    gstin?: string;
    website?: string;
    status?: ClientStatus;
  },
  updatedBy: string
) => {
  const client = await prisma.client.update({
    where: { id },
    data,
  });

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    if (hr.id !== updatedBy) {
      await notificationService.sendNotification({
        userId: hr.id,
        title: 'Client Updated',
        message: `Client "${client.name}" has been updated`,
        type: 'CLIENT',
        link: '/clients',
      });
    }
  }

  return client;
};

export const deactivateClient = async (id: string, deactivatedBy: string) => {
  const client = await prisma.client.update({
    where: { id },
    data: { status: ClientStatus.INACTIVE },
  });

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    if (hr.id !== deactivatedBy) {
      await notificationService.sendNotification({
        userId: hr.id,
        title: 'Client Deactivated',
        message: `Client "${client.name}" has been deactivated`,
        type: 'CLIENT',
        link: '/clients',
      });
    }
  }

  return client;
};

export const getClientStats = async () => {
  const [active, inactive, totalProjects] = await Promise.all([
    prisma.client.count({ where: { status: ClientStatus.ACTIVE } }),
    prisma.client.count({ where: { status: ClientStatus.INACTIVE } }),
    prisma.project.count(),
  ]);

  return {
    active,
    inactive,
    totalProjects,
    total: active + inactive,
  };
};
