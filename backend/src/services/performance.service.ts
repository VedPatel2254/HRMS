import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMyGoals = async (userId: string) => {
  return prisma.performanceGoal.findMany({
    where: { userId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createGoal = async (
  data: {
    userId?: string;
    title: string;
    description?: string;
    targetDate?: string;
    weight?: number;
  },
  createdBy: string
) => {
  return prisma.performanceGoal.create({
    data: {
      userId: data.userId || createdBy,
      title: data.title,
      description: data.description,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      weight: data.weight,
      createdBy,
    },
  });
};

export const updateGoal = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    targetDate?: string;
    weight?: number;
    status?: string;
  }
) => {
  return prisma.performanceGoal.update({
    where: { id },
    data: {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    },
  });
};

export const deleteGoal = async (id: string) => {
  return prisma.performanceGoal.delete({ where: { id } });
};

export const getMyReviews = async (userId: string) => {
  return prisma.performanceReview.findMany({
    where: { userId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      reviewer: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getAllReviews = async (query?: {
  period?: string;
  year?: number;
  status?: string;
}) => {
  const where: Record<string, unknown> = {};
  if (query?.period) where.period = query.period;
  if (query?.year) where.year = query.year;
  if (query?.status) where.status = query.status;

  return prisma.performanceReview.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      reviewer: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const startReviewCycle = async (
  data: {
    userIds: string[];
    period: string;
    year: number;
  },
  createdBy: string
) => {
  const reviews = await Promise.all(
    data.userIds.map((userId) =>
      prisma.performanceReview.create({
        data: {
          userId,
          reviewerId: createdBy,
          period: data.period,
          year: data.year,
          status: 'DRAFT',
        },
      })
    )
  );

  return reviews;
};

export const submitSelfRating = async (
  id: string,
  userId: string,
  data: {
    selfRating: number;
    selfComments?: string;
  }
) => {
  const review = await prisma.performanceReview.findUnique({ where: { id } });

  if (!review) throw new Error('Review not found.');
  if (review.userId !== userId) throw new Error('You can only submit self-rating for your own review.');
  if (review.status !== 'DRAFT') throw new Error('Review is not in draft status.');

  return prisma.performanceReview.update({
    where: { id },
    data: {
      selfRating: data.selfRating,
      selfComments: data.selfComments,
      status: 'SUBMITTED',
    },
  });
};

export const submitManagerRating = async (
  id: string,
  data: {
    managerRating: number;
    managerComments?: string;
  }
) => {
  const review = await prisma.performanceReview.findUnique({ where: { id } });

  if (!review) throw new Error('Review not found.');
  if (review.status !== 'SUBMITTED') throw new Error('Review must be submitted by employee first.');

  const overallRating = Math.round(
    ((review.selfRating || 0) + data.managerRating) / 2
  );

  return prisma.performanceReview.update({
    where: { id },
    data: {
      managerRating: data.managerRating,
      managerComments: data.managerComments,
      overallRating,
      status: 'COMPLETED',
    },
  });
};

export const getAllGoals = async (query?: { userId?: string }) => {
  const where: Record<string, unknown> = {};
  if (query?.userId) where.userId = query.userId;

  return prisma.performanceGoal.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
