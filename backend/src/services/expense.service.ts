import { PrismaClient } from '@prisma/client';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

export const getMyExpenses = async (userId: string) => {
  return prisma.expenseClaim.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const createExpense = async (
  data: {
    title: string;
    amount: number;
    category: string;
    receiptUrl?: string;
    date: string;
  },
  userId: string
) => {
  const expense = await prisma.expenseClaim.create({
    data: {
      ...data,
      date: new Date(data.date),
      userId,
      status: 'PENDING',
    },
  });

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    await notificationService.sendNotification({
      userId: hr.id,
      title: 'New Expense Claim',
      message: `New expense claim "${expense.title}" for ₹${expense.amount}`,
      type: 'EXPENSE',
      link: '/expenses/manage',
    });
  }

  return expense;
};

export const getAllExpenses = async (query?: {
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query?.page || 1;
  const limit = query?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query?.status) where.status = query.status;
  if (query?.userId) where.userId = query.userId;

  const [expenses, total] = await Promise.all([
    prisma.expenseClaim.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.expenseClaim.count({ where }),
  ]);

  return {
    data: expenses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const approveExpense = async (id: string, reviewerId: string, reviewerNote?: string) => {
  const expense = await prisma.expenseClaim.findUnique({ where: { id } });
  if (!expense) throw new Error('Expense claim not found.');
  if (expense.status !== 'PENDING') throw new Error('Expense claim is not pending.');
  if (expense.userId === reviewerId) throw new Error('You cannot approve your own claim');

  const updated = await prisma.expenseClaim.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewerNote,
    },
  });

  await notificationService.sendNotification({
    userId: expense.userId,
    title: 'Expense Approved',
    message: `Your expense claim "${expense.title}" has been approved.`,
    type: 'EXPENSE',
    link: '/expenses',
  });

  return updated;
};

export const rejectExpense = async (id: string, reviewerId: string, reviewerNote?: string) => {
  const expense = await prisma.expenseClaim.findUnique({ where: { id } });
  if (!expense) throw new Error('Expense claim not found.');
  if (expense.status !== 'PENDING') throw new Error('Expense claim is not pending.');
  if (expense.userId === reviewerId) throw new Error('You cannot approve your own claim');

  const updated = await prisma.expenseClaim.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewerNote,
    },
  });

  await notificationService.sendNotification({
    userId: expense.userId,
    title: 'Expense Rejected',
    message: `Your expense claim "${expense.title}" has been rejected.`,
    type: 'EXPENSE',
    link: '/expenses',
  });

  return updated;
};

export const markAsPaid = async (id: string) => {
  const expense = await prisma.expenseClaim.findUnique({ where: { id } });
  if (!expense) throw new Error('Expense claim not found.');
  if (expense.status !== 'APPROVED') throw new Error('Expense claim is not approved.');

  const updated = await prisma.expenseClaim.update({
    where: { id },
    data: { status: 'PAID' },
  });

  await notificationService.sendNotification({
    userId: expense.userId,
    title: 'Expense Paid',
    message: `Your expense claim "${expense.title}" has been marked as paid.`,
    type: 'EXPENSE',
    link: '/expenses',
  });

  return updated;
};

export const deleteExpense = async (id: string, userId: string, role: string) => {
  const expense = await prisma.expenseClaim.findUnique({ where: { id } });
  if (!expense) throw new Error('Expense claim not found.');
  if (expense.status !== 'PENDING') throw new Error('Only pending expenses can be deleted.');
  if (expense.userId !== userId && role !== 'ADMIN' && role !== 'HR') {
    throw new Error('You do not have permission to delete this expense.');
  }

  await prisma.expenseClaim.delete({ where: { id } });
  return { message: 'Expense deleted successfully.' };
};
