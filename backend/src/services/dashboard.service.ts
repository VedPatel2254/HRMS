import { PrismaClient, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getTodayDate = (): Date => {
  const now = new Date();
  const utcMs = now.getTime();
  const istMs = utcMs + IST_OFFSET_MS + now.getTimezoneOffset() * 60 * 1000;
  const ist = new Date(istMs);
  return new Date(Date.UTC(ist.getFullYear(), ist.getMonth(), ist.getDate()));
};

export const getAdminDashboardStats = async (userId: string) => {
  const today = getTodayDate();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [
    totalEmployees,
    presentToday,
    onLeaveToday,
    openTickets,
    activeProjects,
    pendingLeaveRequests,
    pendingExpenseClaims,
    recentEmployees,
    headcountByRole,
    payrollDueThisMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.attendance.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: AttendanceStatus.PRESENT,
      },
    }),
    prisma.attendance.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: AttendanceStatus.ON_LEAVE,
      },
    }),
    prisma.helpdeskTicket.count({ where: { status: 'OPEN' } }),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.expenseClaim.count({ where: { status: 'PENDING' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        designation: true,
        profilePicture: true,
        createdAt: true,
      },
    }),
    prisma.user.groupBy({
      by: ['role'],
      where: { status: 'ACTIVE' },
      _count: { role: true },
    }),
    prisma.payroll.count({
      where: {
        month: currentMonth,
        year: currentYear,
        paymentStatus: 'PENDING',
      },
    }),
  ]);

  return {
    totalEmployees,
    presentToday,
    onLeaveToday,
    openTickets,
    activeProjects,
    pendingLeaveRequests,
    pendingExpenseClaims,
    recentEmployees,
    headcountByRole: headcountByRole.map((item) => ({
      role: item.role,
      count: item._count.role,
    })),
    payrollDueThisMonth,
  };
};

export const getEmployeeDashboardStats = async (userId: string) => {
  const today = getTodayDate();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const currentYear = today.getFullYear();

  const [todayAttendance, leaveBalance, taskStats, announcements, latestPayslip] = await Promise.all([
    prisma.attendance.findFirst({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
    }),
    prisma.leaveBalance.findMany({
      where: { userId, year: currentYear },
      include: { leaveType: true },
    }),
    Promise.all([
      prisma.task.count({ where: { assignedTo: userId, status: 'TODO' } }),
      prisma.task.count({ where: { assignedTo: userId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { assignedTo: userId, status: 'DONE' } }),
    ]),
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.payroll.findFirst({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
  ]);

  const [todo, inProgress, done] = taskStats;

  return {
    todayAttendance,
    leaveBalance: leaveBalance.map((lb) => ({
      id: lb.id,
      leaveType: lb.leaveType?.name,
      code: lb.leaveType?.code,
      allocated: lb.allocated,
      used: lb.used,
      remaining: lb.remaining,
    })),
    taskStats: { todo, inProgress, done },
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      priority: a.priority,
      postedBy: `${a.user.firstName} ${a.user.lastName}`,
      createdAt: a.createdAt,
    })),
    latestPayslip: latestPayslip
      ? {
          id: latestPayslip.id,
          month: latestPayslip.month,
          year: latestPayslip.year,
          netSalary: latestPayslip.netSalary,
          paymentStatus: latestPayslip.paymentStatus,
        }
      : null,
  };
};
