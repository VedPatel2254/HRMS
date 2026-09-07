import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCompanySettings = async () => {
  let settings = await prisma.settings.findUnique({ where: { id: '1' } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: '1' } });
  }
  return settings;
};

export const updateCompanySettings = async (data: {
  companyName?: string;
  address?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  financialYearStart?: number;
}) => {
  let settings = await prisma.settings.findUnique({ where: { id: '1' } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: '1', ...data } });
  } else {
    settings = await prisma.settings.update({ where: { id: '1' }, data });
  }
  return settings;
};

export const getHolidays = async (year?: number) => {
  const targetYear = year || new Date().getFullYear();
  return prisma.holidayCalendar.findMany({
    where: { year: targetYear },
    orderBy: { date: 'asc' },
  });
};

export const createHoliday = async (data: { name: string; date: Date; type: string }) => {
  const year = new Date(data.date).getFullYear();
  return prisma.holidayCalendar.create({ data: { ...data, year } });
};

export const updateHoliday = async (id: string, data: { name?: string; date?: Date; type?: string }) => {
  const updateData: Record<string, unknown> = { ...data };
  if (data.date) {
    updateData.year = new Date(data.date).getFullYear();
  }
  return prisma.holidayCalendar.update({ where: { id }, data: updateData });
};

export const deleteHoliday = async (id: string) => {
  return prisma.holidayCalendar.delete({ where: { id } });
};

export const getAllUsers = async (query: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.role) where.role = query.role;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { employeeId: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        designation: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const updateUserRole = async (userId: string, role: string) => {
  return prisma.user.update({ where: { id: userId }, data: { role: role as never } });
};

export const deactivateUser = async (userId: string) => {
  return prisma.user.update({ where: { id: userId }, data: { status: 'INACTIVE' as never } });
};

export const resetUserPassword = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const tempPassword = `Prs@${user.employeeId}`;
  return { tempPassword, userId };
};

export const getAuditLogs = async (query: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entity?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.userId) where.userId = query.userId;
  if (query.action) where.action = query.action;
  if (query.entity) where.entity = query.entity;
  if (query.fromDate || query.toDate) {
    where.createdAt = {};
    if (query.fromDate) (where.createdAt as Record<string, unknown>).gte = new Date(query.fromDate);
    if (query.toDate) (where.createdAt as Record<string, unknown>).lte = new Date(query.toDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, employeeId: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createAuditLog = async (data: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) => {
  return prisma.auditLog.create({ data });
};
