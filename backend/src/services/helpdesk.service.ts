import { PrismaClient } from '@prisma/client';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

export const getMyTickets = async (userId: string) => {
  return prisma.helpdeskTicket.findMany({
    where: { raisedBy: userId },
    include: {
      raiser: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      assignee: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createTicket = async (
  data: {
    title: string;
    description: string;
    category: string;
    priority?: string;
  },
  userId: string
) => {
  const ticket = await prisma.helpdeskTicket.create({
    data: {
      ...data,
      raisedBy: userId,
      status: 'OPEN',
    },
  });

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    await notificationService.sendNotification({
      userId: hr.id,
      title: 'New Helpdesk Ticket',
      message: `New ticket "${ticket.title}" raised`,
      type: 'TICKET',
      link: '/helpdesk/manage',
    });
  }

  return ticket;
};

export const getAllTickets = async (query?: {
  status?: string;
  category?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query?.page || 1;
  const limit = query?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query?.status) where.status = query.status;
  if (query?.category) where.category = query.category;
  if (query?.priority) where.priority = query.priority;

  const [tickets, total] = await Promise.all([
    prisma.helpdeskTicket.findMany({
      where,
      include: {
        raiser: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.helpdeskTicket.count({ where }),
  ]);

  return {
    data: tickets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const assignTicket = async (id: string, assignedTo: string) => {
  const ticket = await prisma.helpdeskTicket.findUnique({ where: { id } });
  if (!ticket) throw new Error('Ticket not found.');

  const updated = await prisma.helpdeskTicket.update({
    where: { id },
    data: {
      assignedTo,
      status: 'IN_PROGRESS',
    },
  });

  await notificationService.sendNotification({
    userId: assignedTo,
    title: 'Ticket Assigned',
    message: `You have been assigned ticket "${ticket.title}"`,
    type: 'TICKET',
    link: '/helpdesk/manage',
  });

  return updated;
};

export const resolveTicket = async (id: string, resolution?: string) => {
  const ticket = await prisma.helpdeskTicket.findUnique({ where: { id } });
  if (!ticket) throw new Error('Ticket not found.');

  const updated = await prisma.helpdeskTicket.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      resolution,
      resolvedAt: new Date(),
    },
  });

  await notificationService.sendNotification({
    userId: ticket.raisedBy,
    title: 'Ticket Resolved',
    message: `Your ticket "${ticket.title}" has been resolved`,
    type: 'TICKET',
    link: '/helpdesk',
  });

  return updated;
};

export const closeTicket = async (id: string) => {
  const ticket = await prisma.helpdeskTicket.findUnique({ where: { id } });
  if (!ticket) throw new Error('Ticket not found.');

  return prisma.helpdeskTicket.update({
    where: { id },
    data: { status: 'CLOSED' },
  });
};
