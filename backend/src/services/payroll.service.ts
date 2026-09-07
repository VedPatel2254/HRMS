import { PrismaClient, PaymentStatus } from '@prisma/client';
import { calculatePayroll } from '../utils/payrollCalculator';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1];
};

const getWorkingDaysInMonth = (month: number, year: number): number => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
};

export const generatePayroll = async (
  month: number,
  year: number,
  generatedByUserId: string
) => {
  const existingPayroll = await prisma.payroll.findFirst({
    where: { month, year },
  });

  if (existingPayroll) {
    throw new Error(`Payroll for ${getMonthName(month)} ${year} already exists.`);
  }

  const employees = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    include: { salaryStructure: true },
  });

  const workingDays = getWorkingDaysInMonth(month, year);
  let generated = 0;
  let skipped = 0;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  for (const employee of employees) {
    if (!employee.salaryStructure) {
      skipped++;
      continue;
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: employee.id,
        date: { gte: startDate, lte: endDate },
        status: { in: ['PRESENT', 'HALF_DAY'] },
      },
    });

    let presentDays = attendanceRecords.length;
    const halfDays = attendanceRecords.filter((a) => a.status === 'HALF_DAY').length;
    presentDays = presentDays - halfDays * 0.5;

    const payrollResult = calculatePayroll({
      basicSalary: employee.salaryStructure.basicSalary,
      hra: employee.salaryStructure.hra,
      travelAllowance: employee.salaryStructure.travelAllowance,
      medicalAllowance: employee.salaryStructure.medicalAllowance,
      otherAllowances: employee.salaryStructure.otherAllowances,
      bonus: 0,
      otherDeductions: 0,
      pfEmployeePercent: employee.salaryStructure.pfEmployeePercent,
      pfEmployerPercent: employee.salaryStructure.pfEmployerPercent,
      esiEmployeePercent: employee.salaryStructure.esiEmployeePercent,
      esiEmployerPercent: employee.salaryStructure.esiEmployerPercent,
      tdsPercent: employee.salaryStructure.tdsPercent,
      workingDays,
      presentDays,
    });

    await prisma.payroll.create({
      data: {
        userId: employee.id,
        month,
        year,
        basicSalary: employee.salaryStructure.basicSalary,
        hra: employee.salaryStructure.hra,
        travelAllowance: employee.salaryStructure.travelAllowance,
        medicalAllowance: employee.salaryStructure.medicalAllowance,
        otherAllowances: employee.salaryStructure.otherAllowances,
        bonus: 0,
        lossOfPay: payrollResult.lossOfPay,
        otherDeductions: 0,
        pfEmployee: payrollResult.pfEmployee,
        pfEmployer: payrollResult.pfEmployer,
        esiEmployee: payrollResult.esiEmployee,
        esiEmployer: payrollResult.esiEmployer,
        tds: payrollResult.tds,
        grossSalary: payrollResult.grossSalary,
        netSalary: payrollResult.netSalary,
        totalDeductions: payrollResult.totalDeductions,
        workingDays,
        presentDays,
        generatedBy: generatedByUserId,
      },
    });

    generated++;

    await notificationService.sendNotification({
      userId: employee.id,
      title: 'Payslip Generated',
      message: `Your payslip for ${getMonthName(month)} ${year} is ready.`,
      type: 'PAYROLL',
      link: '/payroll',
    });
  }

  return { generated, skipped };
};

export const getMyPayslips = async (userId: string) => {
  return prisma.payroll.findMany({
    where: { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
};

export const getPayslipDetail = async (
  userId: string,
  month: number,
  year: number,
  requesterId: string,
  isHR: boolean
) => {
  const payroll = await prisma.payroll.findUnique({
    where: { userId_month_year: { userId, month, year } },
    include: {
      user: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
          designation: true,
          bankAccountNumber: true,
        },
      },
    },
  });

  if (!payroll) throw new Error('Payslip not found.');
  if (payroll.userId !== requesterId && !isHR) {
    throw new Error('Access denied.');
  }

  return payroll;
};

export const getAllPayroll = async (filters?: {
  month?: number;
  year?: number;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters?.month) where.month = filters.month;
  if (filters?.year) where.year = filters.year;
  if (filters?.status) where.paymentStatus = filters.status as PaymentStatus;

  const [payrolls, total] = await Promise.all([
    prisma.payroll.findMany({
      where,
      include: {
        user: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.payroll.count({ where }),
  ]);

  return {
    data: payrolls,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const markAsPaid = async (payrollId: string) => {
  return prisma.payroll.update({
    where: { id: payrollId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      paidAt: new Date(),
    },
  });
};

export const addBonus = async (payrollId: string, bonusAmount: number) => {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
  });

  if (!payroll) throw new Error('Payroll not found.');

  const newBonus = payroll.bonus + bonusAmount;
  const newGross = payroll.grossSalary + bonusAmount;
  const newNet = newGross - payroll.totalDeductions;

  return prisma.payroll.update({
    where: { id: payrollId },
    data: {
      bonus: newBonus,
      grossSalary: newGross,
      netSalary: newNet,
    },
  });
};

export const deletePayroll = async (payrollId: string) => {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
  });

  if (!payroll) throw new Error('Payroll not found.');
  if (payroll.paymentStatus !== PaymentStatus.PENDING) {
    throw new Error('Only pending payrolls can be deleted.');
  }

  return prisma.payroll.delete({ where: { id: payrollId } });
};
