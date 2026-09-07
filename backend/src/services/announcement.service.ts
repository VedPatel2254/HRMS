import { PrismaClient, Role } from '@prisma/client';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

export const getAnnouncements = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) throw new Error('User not found.');

  return prisma.announcement.findMany({
    where: {
      OR: [
        { targetRoles: { has: user.role } },
        { targetRoles: { has: 'ALL' } },
      ],
      expiresAt: null,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });
};

export const createAnnouncement = async (
  data: {
    title: string;
    content: string;
    priority?: string;
    targetRoles?: string[];
    expiresAt?: string;
  },
  postedBy: string
) => {
  const announcement = await prisma.announcement.create({
    data: {
      ...data,
      targetRoles: data.targetRoles || ['ALL'],
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      postedBy,
    },
  });

  const whereClause: Record<string, unknown> = {
    status: 'ACTIVE',
  };

  if (data.targetRoles && !data.targetRoles.includes('ALL')) {
    whereClause.role = { in: data.targetRoles as Role[] };
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: { id: true },
  });

  for (const user of users) {
    await notificationService.sendNotification({
      userId: user.id,
      title: 'New Announcement',
      message: `${announcement.title}`,
      type: 'ANNOUNCEMENT',
      link: '/announcements',
    });
  }

  return announcement;
};

export const updateAnnouncement = async (
  id: string,
  data: {
    title?: string;
    content?: string;
    priority?: string;
    targetRoles?: string[];
    expiresAt?: string;
  }
) => {
  return prisma.announcement.update({
    where: { id },
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });
};

export const deleteAnnouncement = async (id: string) => {
  return prisma.announcement.delete({ where: { id } });
};
