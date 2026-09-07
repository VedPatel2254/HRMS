import { PrismaClient, TaskStatus, Priority, Role } from '@prisma/client';
import * as notificationService from './notification.service';

const prisma = new PrismaClient();

export const getAllTasks = async (
  userId: string,
  role: Role,
  query: {
    status?: string;
    priority?: string;
    projectId?: string;
    assignedTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    page?: number;
    limit?: number;
  }
) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (role === Role.EMPLOYEE || role === Role.INTERN) {
    where.assignedTo = userId;
  } else if (query.assignedTo) {
    where.assignedTo = query.assignedTo;
  }

  if (query.status) where.status = query.status as TaskStatus;
  if (query.priority) where.priority = query.priority as Priority;
  if (query.projectId) where.projectId = query.projectId;

  if (query.dueDateFrom && query.dueDateTo) {
    where.dueDate = {
      gte: new Date(query.dueDateFrom),
      lte: new Date(query.dueDateTo),
    };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
        assigner: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const createTask = async (
  data: {
    title: string;
    description?: string;
    projectId?: string;
    assignedTo: string | string[];
    priority?: Priority;
    dueDate?: string;
    estimatedHours?: number;
    status?: TaskStatus;
  },
  createdBy: string
) => {
  const assigneeIds = Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo];

  const creator = await prisma.user.findUnique({ where: { id: createdBy }, select: { role: true } });
  if (creator?.role === Role.HR) {
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, role: true },
    });
    const blocked = assignees.filter((a) => a.role === Role.ADMIN);
    if (blocked.length > 0) {
      const err = new Error('HR cannot assign tasks to ADMIN users.') as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    }
  }

  const createdTasks = [];

  for (const assigneeId of assigneeIds) {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assignedTo: assigneeId,
        assignedBy: createdBy,
        priority: data.priority || Priority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        estimatedHours: data.estimatedHours,
        status: data.status || TaskStatus.TODO,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
        project: { select: { id: true, name: true } },
      },
    });

    await notificationService.sendNotification({
      userId: assigneeId,
      title: 'New Task Assigned',
      message: `New task assigned: ${data.title}`,
      type: 'TASK',
      link: '/tasks',
    });

    createdTasks.push(task);
  }

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
    select: { id: true },
  });

  const assigneeWord = assigneeIds.length > 1 ? `${assigneeIds.length} employees` : 'an employee';
  for (const hr of hrUsers) {
    if (hr.id !== createdBy) {
      await notificationService.sendNotification({
        userId: hr.id,
        title: 'New Task Created',
        message: `New task "${data.title}" assigned to ${assigneeWord}`,
        type: 'TASK',
        link: '/tasks',
      });
    }
  }

  return createdTasks.length === 1 ? createdTasks[0] : { tasks: createdTasks, count: createdTasks.length };
};

export const getTask = async (
  id: string,
  userId: string,
  role: Role
) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, profilePicture: true, designation: true } },
      assigner: { select: { id: true, firstName: true, lastName: true } },
      project: { select: { id: true, name: true } },
      comments: {
        include: { user: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } },
        orderBy: { createdAt: 'desc' },
      },
      attachments: {
        include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      phases: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!task) throw new Error('Task not found.');

  if (role === Role.EMPLOYEE || role === Role.INTERN) {
    if (task.assignedTo !== userId) throw new Error('Access denied.');
  }

  return task;
};

export const updateTask = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    priority?: Priority;
    status?: TaskStatus;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
  },
  userId: string,
  role: Role
) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error('Task not found.');

  if (role === Role.EMPLOYEE || role === Role.INTERN) {
    if (task.assignedTo !== userId) throw new Error('Access denied.');
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

  if (data.status === TaskStatus.DONE && !task.completedAt) {
    updateData.completedAt = new Date();
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (role === Role.EMPLOYEE || role === Role.INTERN) {
    const hrUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'HR'] }, status: 'ACTIVE' },
      select: { id: true },
    });

    for (const hr of hrUsers) {
      await notificationService.sendNotification({
        userId: hr.id,
        title: 'Task Updated',
        message: `Task "${task.title}" has been updated`,
        type: 'TASK',
        link: '/tasks',
      });
    }
  }

  return updatedTask;
};

export const updateTaskStatus = async (
  id: string,
  status: TaskStatus,
  userId: string
) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error('Task not found.');

  const updateData: Record<string, unknown> = { status };
  if (status === TaskStatus.DONE && !task.completedAt) {
    updateData.completedAt = new Date();
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData,
  });

  if (task.assignedBy !== userId) {
    await notificationService.sendNotification({
      userId: task.assignedBy,
      title: 'Task Status Updated',
      message: `Task "${task.title}" status changed to ${status.replace('_', ' ')}`,
      type: 'TASK',
      link: '/tasks',
    });
  }

  return updatedTask;
};

export const deleteTask = async (id: string, userId: string, role: Role) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error('Task not found.');

  if (role === Role.EMPLOYEE || role === Role.INTERN) {
    if (task.assignedBy !== userId) throw new Error('Access denied.');
  }

  return prisma.task.delete({ where: { id } });
};

export const addComment = async (
  taskId: string,
  userId: string,
  content: string
) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found.');

  const comment = await prisma.taskComment.create({
    data: { taskId, userId, content },
    include: { user: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } },
  });

  const notifyUserIds = new Set<string>();
  if (task.assignedTo !== userId) notifyUserIds.add(task.assignedTo);
  if (task.assignedBy !== userId) notifyUserIds.add(task.assignedBy);

  for (const uid of notifyUserIds) {
    await notificationService.sendNotification({
      userId: uid,
      title: 'New Comment on Task',
      message: `New comment on "${task.title}"`,
      type: 'TASK',
      link: '/tasks',
    });
  }

  return comment;
};

export const getComments = async (taskId: string) => {
  return prisma.taskComment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const getTaskStats = async (userId?: string, role?: Role) => {
  const where: Record<string, unknown> = {};
  if (userId && (role === Role.EMPLOYEE || role === Role.INTERN)) {
    where.assignedTo = userId;
  }

  const stats = await prisma.task.groupBy({
    by: ['status'],
    where,
    _count: { id: true },
  });

  return stats.map((s) => ({
    status: s.status,
    count: s._count.id,
  }));
};
