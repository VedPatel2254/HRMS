import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAttendanceReport = async (month?: number, year?: number) => {
  const currentDate = new Date();
  const targetMonth = month || currentDate.getMonth() + 1;
  const targetYear = year || currentDate.getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const attendance = await prisma.attendance.groupBy({
    by: ['status'],
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  });

  const byEmployee = await prisma.attendance.groupBy({
    by: ['userId', 'status'],
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  });

  return {
    month: targetMonth,
    year: targetYear,
    summary: attendance,
    byEmployee,
  };
};

export const getPayrollReport = async (month?: number, year?: number) => {
  const currentDate = new Date();
  const targetMonth = month || currentDate.getMonth() + 1;
  const targetYear = year || currentDate.getFullYear();

  const payroll = await prisma.payroll.findMany({
    where: {
      month: targetMonth,
      year: targetYear,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
    },
  });

  const totalGross = payroll.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalNet = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const totalDeductions = payroll.reduce((sum, p) => sum + (p.grossSalary - p.netSalary), 0);

  return {
    month: targetMonth,
    year: targetYear,
    totalEmployees: payroll.length,
    totalGross,
    totalNet,
    totalDeductions,
    records: payroll,
  };
};

export const getLeaveReport = async (year?: number) => {
  const targetYear = year || new Date().getFullYear();

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      fromDate: {
        gte: new Date(targetYear, 0, 1),
        lte: new Date(targetYear, 11, 31, 23, 59, 59),
      },
      status: 'APPROVED',
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      leaveType: { select: { name: true, code: true } },
    },
  });

  const byType = leaveRequests.reduce((acc, lr) => {
    const type = lr.leaveType.code;
    acc[type] = (acc[type] || 0) + lr.totalDays;
    return acc;
  }, {} as Record<string, number>);

  const byEmployee = leaveRequests.reduce((acc, lr) => {
    const userId = lr.userId;
    if (!acc[userId]) {
      acc[userId] = {
        user: lr.user,
        totalDays: 0,
        leaves: [] as typeof leaveRequests,
      };
    }
    acc[userId].totalDays += lr.totalDays;
    acc[userId].leaves.push(lr);
    return acc;
  }, {} as Record<string, { user: { id: string; firstName: string; lastName: string; employeeId: string }; totalDays: number; leaves: typeof leaveRequests }>);

  const topLeaveTakers = Object.values(byEmployee)
    .sort((a, b) => b.totalDays - a.totalDays)
    .slice(0, 10);

  return {
    year: targetYear,
    byType,
    topLeaveTakers,
    totalRequests: leaveRequests.length,
  };
};

export const getHeadcountReport = async () => {
  const byRole = await prisma.user.groupBy({
    by: ['role'],
    where: { status: 'ACTIVE' },
    _count: true,
  });

  const byStatus = await prisma.user.groupBy({
    by: ['status'],
    _count: true,
  });

  const byEmploymentType = await prisma.user.groupBy({
    by: ['employmentType'],
    where: { status: 'ACTIVE' },
    _count: true,
  });

  const totalActive = await prisma.user.count({ where: { status: 'ACTIVE' } });
  const totalInactive = await prisma.user.count({ where: { status: { not: 'ACTIVE' } } });

  return {
    total: totalActive + totalInactive,
    totalActive,
    totalInactive,
    byRole,
    byStatus,
    byEmploymentType,
  };
};

export const getTaskReport = async () => {
  const byStatus = await prisma.task.groupBy({
    by: ['status'],
    _count: true,
  });

  const byPriority = await prisma.task.groupBy({
    by: ['priority'],
    _count: true,
  });

  const byEmployee = await prisma.task.groupBy({
    by: ['assignedTo', 'status'],
    _count: true,
  });

  const employeeStats = byEmployee.reduce((acc, item) => {
    const uid = item.assignedTo;
    if (!acc[uid]) {
      acc[uid] = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0, CANCELLED: 0 };
    }
    const key = item.status as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
    acc[uid][key] = item._count;
    return acc;
  }, {} as Record<string, { TODO: number; IN_PROGRESS: number; IN_REVIEW: number; DONE: number; CANCELLED: number }>);

  const completionRates = Object.entries(employeeStats).map(([userId, stats]) => {
    const total = stats.TODO + stats.IN_PROGRESS + stats.IN_REVIEW + stats.DONE + stats.CANCELLED;
    const completed = stats.DONE;
    return {
      userId,
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  return {
    byStatus,
    byPriority,
    completionRates: completionRates.sort((a, b) => b.completionRate - a.completionRate),
  };
};

export const getProjectReport = async () => {
  const byStatus = await prisma.project.groupBy({
    by: ['status'],
    _count: true,
  });

  const byPriority = await prisma.project.groupBy({
    by: ['priority'],
    _count: true,
  });

  return {
    byStatus,
    byPriority,
    total: await prisma.project.count(),
  };
};
