import { PrismaClient, ProjectStatus, Priority, Role } from '@prisma/client';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

export const getAllProjects = async (
  userId: string,
  role: Role,
  query: {
    search?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }
) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (role === Role.EMPLOYEE || role === Role.INTERN) {
    where.members = { some: { userId } };
  }

  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }
  if (query.status) {
    where.status = query.status as ProjectStatus;
  }
  if (query.priority) {
    where.priority = query.priority as Priority;
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } },
        },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    data: projects,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const createProject = async (
  data: {
    name: string;
    description?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    priority?: Priority;
    memberIds?: string[];
  },
  createdBy: string
) => {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      clientId: data.clientId,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      budget: data.budget,
      priority: data.priority || Priority.MEDIUM,
      createdBy,
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: createdBy,
      role: 'LEAD',
    },
  });

  if (data.memberIds && data.memberIds.length > 0) {
    await prisma.projectMember.createMany({
      data: data.memberIds.map((userId) => ({
        projectId: project.id,
        userId,
        role: 'MEMBER',
      })),
    });
  }

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    if (hr.id !== createdBy) {
      await notificationService.sendNotification({
        userId: hr.id,
        title: 'New Project Created',
        message: `New project "${project.name}" has been created`,
        type: 'PROJECT',
        link: '/projects',
      });
    }
  }

  return project;
};

export const getProject = async (
  id: string,
  userId: string,
  role: Role
) => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, profilePicture: true, designation: true } } },
      },
      tasks: {
        select: { status: true },
      },
    },
  });

  if (!project) throw new Error('Project not found.');

  if (role === Role.EMPLOYEE || role === Role.INTERN) {
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) throw new Error('Access denied.');
  }

  const taskStats = {
    TODO: project.tasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    IN_REVIEW: project.tasks.filter((t) => t.status === 'IN_REVIEW').length,
    DONE: project.tasks.filter((t) => t.status === 'DONE').length,
    CANCELLED: project.tasks.filter((t) => t.status === 'CANCELLED').length,
  };

  return {
    ...project,
    taskStats,
    tasks: undefined,
  };
};

export const updateProject = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    clientId?: string;
    status?: ProjectStatus;
    startDate?: string;
    endDate?: string;
    budget?: number;
    priority?: Priority;
  }
) => {
  return prisma.project.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
};

export const archiveProject = async (id: string) => {
  return prisma.project.update({
    where: { id },
    data: { status: ProjectStatus.CANCELLED },
  });
};

export const addMember = async (
  projectId: string,
  userId: string,
  role: string = 'MEMBER'
) => {
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (existing) throw new Error('User is already a member of this project.');

  const member = await prisma.projectMember.create({
    data: { projectId, userId, role },
  });

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    await notificationService.sendNotification({
      userId: hr.id,
      title: 'Project Member Added',
      message: `A new member has been added to project`,
      type: 'PROJECT',
      link: '/projects',
    });
  }

  const addedUser = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
  if (addedUser) {
    await notificationService.sendNotification({
      userId,
      title: 'Added to Project',
      message: `You have been added to a project`,
      type: 'PROJECT',
      link: '/projects',
    });
  }

  return member;
};

export const removeMember = async (projectId: string, userId: string) => {
  const removed = await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  for (const hr of hrUsers) {
    await notificationService.sendNotification({
      userId: hr.id,
      title: 'Project Member Removed',
      message: `A member has been removed from project`,
      type: 'PROJECT',
      link: '/projects',
    });
  }

  await notificationService.sendNotification({
    userId,
    title: 'Removed from Project',
    message: `You have been removed from a project`,
    type: 'PROJECT',
    link: '/projects',
  });

  return removed;
};

export const getProjectTasks = async (projectId: string) => {
  return prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
  });
};

export const getProjectStats = async () => {
  const stats = await prisma.project.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return stats.map((s) => ({
    status: s.status,
    count: s._count.id,
  }));
};
