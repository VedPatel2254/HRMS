import { PrismaClient, LeaveStatus } from '@prisma/client';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

export const getAllLeaveTypes = async () => {
  return prisma.leaveType.findMany({
    orderBy: { name: 'asc' },
  });
};

export const createLeaveType = async (data: {
  name: string;
  code: string;
  defaultDays: number;
  isPaid?: boolean;
  carryForward?: boolean;
  maxCarryForward?: number;
  description?: string;
}) => {
  return prisma.leaveType.create({ data });
};

export const getLeaveBalance = async (userId: string, year?: number) => {
  const currentYear = year || new Date().getFullYear();

  const balances = await prisma.leaveBalance.findMany({
    where: { userId, year: currentYear },
    include: { leaveType: { select: { name: true, code: true } } },
    orderBy: { leaveType: { name: 'asc' } },
  });

  return balances;
};

export const getTeamLeaveBalance = async (year?: number) => {
  const currentYear = year || new Date().getFullYear();

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { employeeId: 'asc' },
  });

  const leaveTypes = await prisma.leaveType.findMany({
    orderBy: { name: 'asc' },
  });

  const balances = await prisma.leaveBalance.findMany({
    where: { year: currentYear },
    include: { leaveType: { select: { code: true } } },
  });

  const result = users.map((user) => ({
    ...user,
    balances: leaveTypes.map((lt) => {
      const balance = balances.find(
        (b) => b.userId === user.id && b.leaveTypeId === lt.id
      );
      return {
        leaveType: lt.name,
        code: lt.code,
        allocated: balance?.allocated || 0,
        used: balance?.used || 0,
        remaining: balance?.remaining || 0,
      };
    }),
  }));

  return result;
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const countWorkingDays = async (fromDate: Date, toDate: Date): Promise<number> => {
  const holidays = await prisma.holidayCalendar.findMany({
    where: {
      date: { gte: fromDate, lte: toDate },
    },
  });

  let count = 0;
  const current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const isHoliday = holidays.some(
      (h) => h.date.toISOString().split('T')[0] === current.toISOString().split('T')[0]
    );
    if (!isWeekend(current) && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

export const applyLeave = async (
  userId: string,
  data: {
    leaveTypeId: string;
    fromDate: string;
    toDate: string;
    reason: string;
    attachmentUrl?: string;
  }
) => {
  const fromDate = new Date(data.fromDate);
  const toDate = new Date(data.toDate);
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(0, 0, 0, 0);

  if (toDate < fromDate) {
    throw new Error('To date cannot be before from date.');
  }

  const totalDays = await countWorkingDays(fromDate, toDate);
  if (totalDays === 0) {
    throw new Error('Leave period contains no working days.');
  }

  const leaveType = await prisma.leaveType.findUnique({
    where: { id: data.leaveTypeId },
  });
  if (!leaveType) {
    throw new Error('Leave type not found.');
  }

  const currentYear = fromDate.getFullYear();
  const balance = await prisma.leaveBalance.findUnique({
    where: {
      userId_leaveTypeId_year: {
        userId,
        leaveTypeId: data.leaveTypeId,
        year: currentYear,
      },
    },
  });

  if (leaveType.code !== 'UL' && (!balance || balance.remaining < totalDays)) {
    throw new Error('Insufficient leave balance.');
  }

  const overlappingLeave = await prisma.leaveRequest.findFirst({
    where: {
      userId,
      status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      OR: [
        { fromDate: { lte: toDate }, toDate: { gte: fromDate } },
      ],
    },
  });

  if (overlappingLeave) {
    throw new Error('Leave request overlaps with an existing request.');
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId,
      leaveTypeId: data.leaveTypeId,
      fromDate,
      toDate,
      totalDays,
      reason: data.reason,
      status: LeaveStatus.PENDING,
    },
    include: {
      leaveType: { select: { name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  });

  const applicant = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  let notifyRoles: ('ADMIN' | 'HR')[];
  if (applicant?.role === 'HR') {
    notifyRoles = ['ADMIN'];
  } else {
    notifyRoles = ['HR'];
  }

  const notifyUsers = await prisma.user.findMany({
    where: { role: { in: notifyRoles }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const user of notifyUsers) {
    await notificationService.sendNotification({
      userId: user.id,
      title: 'New Leave Request',
      message: `${leaveRequest.user.firstName} ${leaveRequest.user.lastName} applied for ${leaveRequest.leaveType.name} from ${data.fromDate} to ${data.toDate}`,
      type: 'LEAVE',
      link: '/leave',
    });
  }

  return leaveRequest;
};

export const getMyLeaveRequests = async (
  userId: string,
  filters?: {
    status?: string;
    leaveTypeId?: string;
    page?: number;
    limit?: number;
  }
) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (filters?.status) where.status = filters.status as LeaveStatus;
  if (filters?.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;

  const [requests, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return {
    data: requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAllLeaveRequests = async (filters?: {
  status?: string;
  leaveTypeId?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status as LeaveStatus;
  if (filters?.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.fromDate && filters?.toDate) {
    where.fromDate = { gte: new Date(filters.fromDate) };
    where.toDate = { lte: new Date(filters.toDate) };
  }

  const [requests, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: { select: { name: true, code: true } },
        user: { select: { employeeId: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return {
    data: requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const approveLeave = async (
  requestId: string,
  reviewerId: string,
  note?: string
) => {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { leaveType: true },
  });

  if (!request) throw new Error('Leave request not found.');
  if (request.status !== LeaveStatus.PENDING) {
    throw new Error('Only pending requests can be approved.');
  }
  if (request.userId === reviewerId) throw new Error('You cannot approve your own leave request');

  const currentYear = request.fromDate.getFullYear();

  const updatedRequest = await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: LeaveStatus.APPROVED,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewerNote: note,
    },
  });

  await prisma.leaveBalance.update({
    where: {
      userId_leaveTypeId_year: {
        userId: request.userId,
        leaveTypeId: request.leaveTypeId,
        year: currentYear,
      },
    },
    data: {
      used: { increment: request.totalDays },
      remaining: { decrement: request.totalDays },
    },
  });

  const current = new Date(request.fromDate);
  const end = new Date(request.toDate);
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    if (!isWeekend(current)) {
      const dateStr = current.toISOString().split('T')[0];
      const targetDate = new Date(dateStr);
      const existing = await prisma.attendance.findFirst({
        where: { userId: request.userId, date: targetDate },
      });
      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: 'ON_LEAVE' as never },
        });
      } else {
        await prisma.attendance.create({
          data: {
            userId: request.userId,
            date: targetDate,
            status: 'ON_LEAVE' as never,
            notes: `Leave approved: ${request.leaveType.name}`,
          },
        });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  await notificationService.sendNotification({
    userId: request.userId,
    title: 'Leave Approved',
    message: `Your ${request.leaveType.name} request has been approved.`,
    type: 'LEAVE',
    link: '/leave',
  });

  return updatedRequest;
};

export const rejectLeave = async (
  requestId: string,
  reviewerId: string,
  note: string
) => {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { leaveType: true },
  });

  if (!request) throw new Error('Leave request not found.');
  if (request.status !== LeaveStatus.PENDING) {
    throw new Error('Only pending requests can be rejected.');
  }

  const updatedRequest = await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: LeaveStatus.REJECTED,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewerNote: note,
    },
  });

  await notificationService.sendNotification({
    userId: request.userId,
    title: 'Leave Rejected',
    message: `Your ${request.leaveType.name} request has been rejected. Reason: ${note}`,
    type: 'LEAVE',
    link: '/leave',
  });

  return updatedRequest;
};

export const cancelLeave = async (requestId: string, userId: string) => {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error('Leave request not found.');
  if (request.userId !== userId) {
    throw new Error('You can only cancel your own requests.');
  }
  if (request.status !== LeaveStatus.PENDING) {
    throw new Error('Only pending requests can be cancelled.');
  }

  return prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: LeaveStatus.CANCELLED },
  });
};

export const getTeamLeaveCalendar = async (month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: LeaveStatus.APPROVED,
      fromDate: { lte: endDate },
      toDate: { gte: startDate },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
      leaveType: { select: { name: true, code: true } },
    },
  });

  return approvedLeaves;
};
