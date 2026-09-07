import { PrismaClient, Role } from '@prisma/client';
import * as notificationService from './notification.service';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getAllJobPostings = async (query?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query?.page || 1;
  const limit = query?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query?.status) where.status = query.status;

  const [jobs, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      include: {
        _count: { select: { applicants: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.jobPosting.count({ where }),
  ]);

  return {
    data: jobs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const createJobPosting = async (
  data: {
    title: string;
    description?: string;
    requirements?: string;
    responsibilities?: string;
    department?: string;
    location?: string;
    type?: string;
    salaryMin?: number;
    salaryMax?: number;
    openings?: number;
    closingDate?: string;
  },
  createdBy: string
) => {
  return prisma.jobPosting.create({
    data: {
      ...data,
      type: data.type || 'FULL_TIME',
      openings: data.openings || 1,
      closingDate: data.closingDate ? new Date(data.closingDate) : undefined,
      createdBy,
    },
  });
};

export const getJobPosting = async (id: string) => {
  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      applicants: {
        orderBy: { createdAt: 'desc' },
      },
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!job) throw new Error('Job posting not found.');
  return job;
};

export const updateJobPosting = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    requirements?: string;
    responsibilities?: string;
    department?: string;
    location?: string;
    type?: string;
    salaryMin?: number;
    salaryMax?: number;
    openings?: number;
    closingDate?: string;
    status?: string;
  }
) => {
  return prisma.jobPosting.update({
    where: { id },
    data: {
      ...data,
      closingDate: data.closingDate ? new Date(data.closingDate) : undefined,
    },
  });
};

export const addApplicant = async (
  data: {
    jobPostingId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
    coverLetter?: string;
    currentCompany?: string;
    currentDesignation?: string;
    noticePeriod?: number;
    expectedSalary?: number;
  }
) => {
  const applicant = await prisma.applicant.create({ data });

  const job = await prisma.jobPosting.findUnique({
    where: { id: data.jobPostingId },
  });

  if (job) {
    const hrUsers = await prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.HR] }, status: 'ACTIVE' },
      select: { id: true },
    });

    for (const hr of hrUsers) {
      await notificationService.sendNotification({
        userId: hr.id,
        title: 'New Applicant',
        message: `New applicant ${applicant.firstName} ${applicant.lastName} for ${job.title}`,
        type: 'RECRUITMENT',
        link: '/recruitment',
      });
    }
  }

  return applicant;
};

export const getApplicant = async (id: string) => {
  const applicant = await prisma.applicant.findUnique({
    where: { id },
    include: {
      jobPosting: { select: { id: true, title: true } },
      interviews: {
        include: {
          interviewers: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      },
    },
  });

  if (!applicant) throw new Error('Applicant not found.');
  return applicant;
};

export const updateApplicantStatus = async (id: string, status: string, notes?: string) => {
  return prisma.applicant.update({
    where: { id },
    data: { status, notes },
  });
};

export const scheduleInterview = async (
  applicantId: string,
  data: {
    scheduledAt: string;
    mode?: string;
    interviewerIds?: string[];
  }
) => {
  const interview = await prisma.interview.create({
    data: {
      applicantId,
      scheduledAt: new Date(data.scheduledAt),
      mode: data.mode || 'VIDEO',
    },
  });

  if (data.interviewerIds && data.interviewerIds.length > 0) {
    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        interviewers: {
          connect: data.interviewerIds.map((id) => ({ id })),
        },
      },
    });
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: 'INTERVIEW_SCHEDULED' },
  });

  return interview;
};

export const updateInterview = async (
  id: string,
  data: {
    feedback?: string;
    rating?: number;
    result?: string;
  }
) => {
  const interview = await prisma.interview.update({
    where: { id },
    data,
  });

  if (data.result) {
    const interviewWithApplicant = await prisma.interview.findUnique({
      where: { id },
      select: { applicantId: true },
    });

    if (interviewWithApplicant) {
      await prisma.applicant.update({
        where: { id: interviewWithApplicant.applicantId },
        data: {
          status: data.result === 'PASS' ? 'SHORTLISTED' : 'REJECTED',
        },
      });
    }
  }

  return interview;
};

export const hireApplicant = async (applicantId: string) => {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
  });

  if (!applicant) throw new Error('Applicant not found.');
  if (applicant.status === 'HIRED') throw new Error('Applicant already hired.');

  const lastEmployee = await prisma.user.findFirst({
    orderBy: { employeeId: 'desc' },
    select: { employeeId: true },
  });

  let nextNumber = 1;
  if (lastEmployee) {
    const match = lastEmployee.employeeId.match(/PRS-(\d+)/);
    if (match) nextNumber = parseInt(match[1]) + 1;
  }

  const employeeId = `PRS-${String(nextNumber).padStart(3, '0')}`;
  const tempPassword = 'Welcome@123';
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      employeeId,
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      email: applicant.email,
      phone: applicant.phone,
      passwordHash,
      role: Role.EMPLOYEE,
      designation: applicant.currentDesignation,
      dateOfJoining: new Date(),
    },
  });

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: 'HIRED' },
  });

  return {
    user,
    tempPassword,
    employeeId,
  };
};
