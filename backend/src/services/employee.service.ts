import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

interface EmployeeQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  designation?: string;
  role?: string;
  employmentType?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  panNumber?: string;
  salaryStructure?: {
    basicSalary: number;
    hra?: number;
    travelAllowance?: number;
    medicalAllowance?: number;
    otherAllowances?: number;
    pfEmployeePercent?: number;
    pfEmployerPercent?: number;
    esiEmployeePercent?: number;
    esiEmployerPercent?: number;
    tdsPercent?: number;
  };
}

interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  designation?: string;
  role?: string;
  employmentType?: string;
  status?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  panNumber?: string;
  profilePicture?: string;
  salaryStructure?: {
    basicSalary?: number;
    hra?: number;
    travelAllowance?: number;
    medicalAllowance?: number;
    otherAllowances?: number;
    pfEmployeePercent?: number;
    pfEmployerPercent?: number;
    esiEmployeePercent?: number;
    esiEmployerPercent?: number;
    tdsPercent?: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const excludeSensitiveFields = (user: any) => {
  const { passwordHash, refreshToken, passwordResetToken, passwordResetExpiry, ...safe } = user;
  return safe;
};

export const getAllEmployees = async (query: EmployeeQuery) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { employeeId: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.role) where.role = query.role as Role;
  if (query.status) where.status = query.status as UserStatus;

  const [employees, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { salaryStructure: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: employees.map(excludeSensitiveFields),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const createEmployee = async (data: CreateEmployeeData) => {
  const maxEmployee = await prisma.user.findFirst({
    orderBy: { employeeId: 'desc' },
    select: { employeeId: true },
  });

  let nextNumber = 1;
  if (maxEmployee) {
    const lastNum = parseInt(maxEmployee.employeeId.replace('PRS-', ''), 10);
    if (!isNaN(lastNum)) nextNumber = lastNum + 1;
  }
  const employeeId = `PRS-${String(nextNumber).padStart(3, '0')}`;
  const tempPassword = `Prs@${employeeId}`;
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        role: (data.role as Role) || Role.EMPLOYEE,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : new Date(),
        designation: data.designation,
        employmentType: (data.employmentType as never) || 'FULL_TIME',
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        bankAccountNumber: data.bankAccountNumber,
        bankIFSC: data.bankIFSC,
        bankName: data.bankName,
        panNumber: data.panNumber,
      },
      include: { salaryStructure: true },
    });

    if (data.salaryStructure) {
      await tx.salaryStructure.create({
        data: {
          userId: user.id,
          basicSalary: data.salaryStructure.basicSalary,
          hra: data.salaryStructure.hra || 0,
          travelAllowance: data.salaryStructure.travelAllowance || 0,
          medicalAllowance: data.salaryStructure.medicalAllowance || 0,
          otherAllowances: data.salaryStructure.otherAllowances || 0,
          pfEmployeePercent: data.salaryStructure.pfEmployeePercent || 12,
          pfEmployerPercent: data.salaryStructure.pfEmployerPercent || 12,
          esiEmployeePercent: data.salaryStructure.esiEmployeePercent || 0.75,
          esiEmployerPercent: data.salaryStructure.esiEmployerPercent || 3.25,
          tdsPercent: data.salaryStructure.tdsPercent || 0,
        },
      });
    }

    const leaveTypes = await tx.leaveType.findMany();
    const currentYear = new Date().getFullYear();
    for (const lt of leaveTypes) {
      await tx.leaveBalance.create({
        data: {
          userId: user.id,
          leaveTypeId: lt.id,
          year: currentYear,
          allocated: lt.defaultDays,
          used: 0,
          remaining: lt.defaultDays,
        },
      });
    }

    return tx.user.findUnique({
      where: { id: user.id },
      include: { salaryStructure: true },
    });
  });

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    await notificationService.sendNotification({
      userId: hr.id,
      title: 'New Employee Added',
      message: `New employee "${result!.firstName} ${result!.lastName}" has been added`,
      type: 'EMPLOYEE',
      link: '/employees',
    });
  }

  return { user: excludeSensitiveFields(result!), tempPassword };
};

export const getEmployee = async (id: string, requesterId: string, requesterRole: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { salaryStructure: true },
  });

  if (!user) throw new Error('Employee not found.');

  if ((requesterRole === 'EMPLOYEE' || requesterRole === 'INTERN') && requesterId !== id) {
    throw new Error('Access denied. You can only view your own profile.');
  }

  return excludeSensitiveFields(user);
};

export const updateEmployee = async (
  id: string,
  data: UpdateEmployeeData,
  requesterId: string,
  requesterRole: string
) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw new Error('Employee not found.');

  const isSelfUpdate = requesterId === id;
  const isHRorAdmin = requesterRole === 'ADMIN' || requesterRole === 'HR';
  if (!isHRorAdmin && !isSelfUpdate) throw new Error('Access denied.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allowedData: any;
  if (isHRorAdmin) {
    allowedData = data;
  } else {
    allowedData = {
      phone: data.phone,
      address: data.address,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      bankAccountNumber: data.bankAccountNumber,
      bankIFSC: data.bankIFSC,
      bankName: data.bankName,
      panNumber: data.panNumber,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const { salaryStructure, ...userData } = allowedData;
    if (userData.dateOfBirth) userData.dateOfBirth = new Date(userData.dateOfBirth);

    const user = await tx.user.update({
      where: { id },
      data: userData,
      include: { salaryStructure: true },
    });

    if (salaryStructure && isHRorAdmin) {
      if (user.salaryStructure) {
        await tx.salaryStructure.update({ where: { userId: id }, data: salaryStructure });
      } else {
        await tx.salaryStructure.create({
          data: { userId: id, basicSalary: salaryStructure.basicSalary || 0, ...salaryStructure },
        });
      }
    }

    return tx.user.findUnique({ where: { id }, include: { salaryStructure: true } });
  });

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    if (hr.id !== requesterId) {
      await notificationService.sendNotification({
        userId: hr.id,
        title: 'Employee Updated',
        message: `Employee "${result!.firstName} ${result!.lastName}" profile has been updated`,
        type: 'EMPLOYEE',
        link: '/employees',
      });
    }
  }

  return excludeSensitiveFields(result!);
};

export const deactivateEmployee = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Employee not found.');
  await prisma.user.update({ where: { id }, data: { status: 'INACTIVE' } });
  return { message: 'Employee deactivated successfully.' };
};

export const uploadDocument = async (userId: string, file: Express.Multer.File) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Employee not found.');
  return {
    fileName: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
  };
};

export const getDocuments = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Employee not found.');

  const documentsDir = `uploads/documents/${userId}`;
  if (!fs.existsSync(documentsDir)) return [];

  return fs.readdirSync(documentsDir).map((filename) => {
    const stats = fs.statSync(`${documentsDir}/${filename}`);
    const parts = filename.split('_');
    const originalName = parts.slice(1).join('_');
    return {
      fileName: filename,
      originalName,
      path: `${documentsDir}/${filename}`,
      size: stats.size,
      uploadedAt: stats.mtime.toISOString(),
    };
  });
};

export const deleteDocument = async (userId: string, fileName: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Employee not found.');

  const filePath = `uploads/documents/${userId}/${fileName}`;
  if (!fs.existsSync(filePath)) throw new Error('Document not found.');

  fs.unlinkSync(filePath);
  return { message: 'Document deleted successfully.' };
};

export const getEmployeeStats = async () => {
  const [totalActive, totalInactive, totalInterns, totalHR, totalAdmin, newThisMonth] =
    await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE', role: 'EMPLOYEE' } }),
      prisma.user.count({ where: { status: 'INACTIVE' } }),
      prisma.user.count({ where: { role: 'INTERN', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'HR', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

  return { totalActive, totalInactive, totalInterns, totalHR, totalAdmin, newThisMonth };
};
