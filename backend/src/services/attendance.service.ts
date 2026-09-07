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

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const punchIn = async (
  userId: string,
  lat?: number,
  long?: number,
  ip?: string
) => {
  const today = getTodayDate();

  return prisma.attendance.create({
    data: {
      userId,
      date: today,
      punchIn: new Date(),
      punchInLat: lat,
      punchInLong: long,
      punchInIP: ip,
      status: AttendanceStatus.PRESENT,
    },
  });
};

export const punchOut = async (
  userId: string,
  lat?: number,
  long?: number,
  ip?: string
) => {
  const today = getTodayDate();

  const attendance = await prisma.attendance.findFirst({
    where: {
      userId,
      date: today,
      punchIn: { not: null },
      punchOut: null,
    },
    orderBy: { punchIn: 'desc' },
  });

  if (!attendance) {
    throw new Error('No active punch-in found. Please punch in first.');
  }

  const punchOutTime = new Date();
  const workingHours =
    Math.round(
      ((punchOutTime.getTime() - attendance.punchIn!.getTime()) / (1000 * 60 * 60)) * 100
    ) / 100;

  const status = workingHours < 4 ? AttendanceStatus.HALF_DAY : AttendanceStatus.PRESENT;

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      punchOut: punchOutTime,
      punchOutLat: lat,
      punchOutLong: long,
      punchOutIP: ip,
      workingHours,
      status,
    },
  });
};

export const getTodayAttendance = async (userId: string) => {
  const today = getTodayDate();

  const sessions = await prisma.attendance.findMany({
    where: { userId, date: today },
    orderBy: { punchIn: 'desc' },
  });

  if (sessions.length === 0) return null;

  const latest = sessions[0];
  const totalWorkingHours = sessions.reduce((sum, s) => sum + (s.workingHours || 0), 0);

  return {
    punchIn: latest.punchIn,
    punchOut: latest.punchOut,
    workingHours: totalWorkingHours || null,
    status: latest.status,
    sessions: sessions.map((s) => ({
      punchIn: s.punchIn,
      punchOut: s.punchOut,
      workingHours: s.workingHours,
    })),
  };
};

export const getMyAttendance = async (
  userId: string,
  month: number,
  year: number
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { punchIn: 'asc' },
  });

  const holidays = await prisma.holidayCalendar.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const allDays: Array<{
    date: Date;
    status: string;
    punchIn: Date | null;
    punchOut: Date | null;
    workingHours: number | null;
    isHoliday: boolean;
    holidayName?: string;
  }> = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const dayRecords = records.filter(
      (r) => {
        const rd = new Date(r.date);
        const rdStr = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`;
        return rdStr === dateStr;
      }
    );

    const holiday = holidays.find(
      (h) => {
        const hd = new Date(h.date);
        const hdStr = `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, '0')}-${String(hd.getDate()).padStart(2, '0')}`;
        return hdStr === dateStr;
      }
    );

    if (dayRecords.length > 0) {
      const totalHours = dayRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
      const hasPresent = dayRecords.some((r) => r.status === 'PRESENT');
      const hasHalfDay = dayRecords.some((r) => r.status === 'HALF_DAY');
      const status = hasPresent ? 'PRESENT' : hasHalfDay ? 'HALF_DAY' : dayRecords[0].status;

      allDays.push({
        date,
        status,
        punchIn: dayRecords[0].punchIn,
        punchOut: dayRecords[dayRecords.length - 1].punchOut,
        workingHours: totalHours || null,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
      });
    } else if (holiday) {
      allDays.push({
        date,
        status: 'HOLIDAY',
        punchIn: null,
        punchOut: null,
        workingHours: null,
        isHoliday: true,
        holidayName: holiday.name,
      });
    } else if (isWeekend(date)) {
      allDays.push({
        date,
        status: 'WEEKEND',
        punchIn: null,
        punchOut: null,
        workingHours: null,
        isHoliday: false,
      });
    } else {
      allDays.push({
        date,
        status: 'ABSENT',
        punchIn: null,
        punchOut: null,
        workingHours: null,
        isHoliday: false,
      });
    }
  }

  return allDays;
};

export const getAllAttendance = async (query: {
  date?: string;
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const targetDate = query.date ? new Date(query.date) : getTodayDate();
  targetDate.setHours(0, 0, 0, 0);

  const where: Record<string, unknown> = {
    date: targetDate,
  };

  if (query.userId) where.userId = query.userId;
  if (query.status) where.status = query.status as AttendanceStatus;

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    data: records,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getUserAttendance = async (
  userId: string,
  month: number,
  year: number
) => {
  return getMyAttendance(userId, month, year);
};

export const getMonthlyAttendanceSummary = async (
  userId: string,
  month: number,
  year: number
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const holidays = await prisma.holidayCalendar.count({
    where: { date: { gte: startDate, lte: endDate } },
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  let weekends = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (isWeekend(date)) weekends++;
  }

  const workingDays = daysInMonth - weekends - holidays;

  const dateSet = new Set<string>();
  records.forEach((r) => {
    const d = new Date(r.date);
    dateSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });
  const presentDays = [...dateSet].filter((key) =>
    records.some(
      (r) => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === key &&
          (r.status === 'PRESENT' || r.status === 'HALF_DAY');
      }
    )
  ).length;

  const halfDays = [...dateSet].filter((key) =>
    records.some(
      (r) => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === key &&
          r.status === 'HALF_DAY';
      }
    )
  ).length;

  const leaveDays = records.filter((r) => r.status === 'ON_LEAVE').length;
  const absentDays = workingDays - presentDays - leaveDays;
  const attendancePercentage =
    workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

  return {
    workingDays,
    presentDays,
    absentDays: Math.max(0, absentDays),
    halfDays,
    leaveDays,
    weekends,
    holidays,
    attendancePercentage,
  };
};

export const manualAttendanceEntry = async (
  data: {
    userId: string;
    date: string;
    status: string;
    punchIn?: string;
    punchOut?: string;
    notes?: string;
  },
  adminUserId: string
) => {
  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  let workingHours: number | undefined;
  if (data.punchIn && data.punchOut) {
    const punchIn = new Date(data.punchIn);
    const punchOut = new Date(data.punchOut);
    workingHours =
      Math.round(((punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;
  }

  return prisma.attendance.create({
    data: {
      userId: data.userId,
      date,
      status: data.status as AttendanceStatus,
      punchIn: data.punchIn ? new Date(data.punchIn) : undefined,
      punchOut: data.punchOut ? new Date(data.punchOut) : undefined,
      workingHours,
      notes: data.notes,
      isManualEntry: true,
      approvedBy: adminUserId,
    },
  });
};

export const getAttendanceStats = async () => {
  const today = getTodayDate();

  const [present, absent, onLeave] = await Promise.all([
    prisma.attendance.count({
      where: { date: today, status: 'PRESENT' },
    }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.attendance.count({
      where: { date: today, status: 'ON_LEAVE' },
    }),
  ]);

  const totalActive = await prisma.user.count({ where: { status: 'ACTIVE' } });

  return {
    present,
    absent: totalActive - present - onLeave,
    onLeave,
    total: totalActive,
  };
};
