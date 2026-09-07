import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_MODULES = [
  'dashboard', 'employees', 'attendance', 'leave', 'payroll',
  'tasks', 'projects', 'clients', 'recruitment', 'performance',
  'assets', 'expenses', 'announcements', 'helpdesk', 'reports',
  'settings', 'profile',
];

interface PermData { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean; }
type ModulePerms = Record<string, PermData>;
const DEFAULT_PERMISSIONS: Record<string, ModulePerms> = {
  ADMIN: Object.fromEntries(DEFAULT_MODULES.map(m => [m, { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true }])),
  HR: Object.fromEntries(DEFAULT_MODULES.map(m => [m, {
    canView: true,
    canCreate: !['settings'].includes(m),
    canEdit: !['settings'].includes(m),
    canDelete: false,
    canExport: !['settings'].includes(m),
  }])),
  EMPLOYEE: Object.fromEntries(DEFAULT_MODULES.map(m => [m, {
    canView: ['dashboard', 'tasks', 'projects', 'attendance', 'leave', 'payroll', 'expenses', 'announcements', 'helpdesk', 'performance', 'profile'].includes(m),
    canCreate: ['tasks', 'expenses', 'helpdesk', 'leave'].includes(m),
    canEdit: ['profile', 'expenses'].includes(m),
    canDelete: false,
    canExport: false,
  }])),
  INTERN: Object.fromEntries(DEFAULT_MODULES.map(m => [m, {
    canView: ['dashboard', 'tasks', 'projects', 'attendance', 'leave', 'announcements', 'helpdesk', 'performance', 'profile'].includes(m),
    canCreate: ['tasks', 'helpdesk'].includes(m),
    canEdit: ['profile'].includes(m),
    canDelete: false,
    canExport: false,
  }])),
  TECH_LEAD: Object.fromEntries(DEFAULT_MODULES.map(m => [m, {
    canView: true,
    canCreate: ['tasks', 'projects', 'announcements'].includes(m),
    canEdit: ['tasks', 'projects', 'performance'].includes(m),
    canDelete: false,
    canExport: ['tasks', 'projects', 'reports'].includes(m),
  }])),
  SUPPORT: Object.fromEntries(DEFAULT_MODULES.map(m => [m, {
    canView: ['dashboard', 'tasks', 'projects', 'clients', 'helpdesk', 'announcements', 'reports', 'attendance', 'leave', 'profile'].includes(m),
    canCreate: ['tasks', 'helpdesk'].includes(m),
    canEdit: ['tasks', 'helpdesk'].includes(m),
    canDelete: false,
    canExport: false,
  }])),
};

export const getAllRolePermissions = async () => {
  const permissions = await prisma.rolePermission.findMany({
    orderBy: [{ role: 'asc' }, { module: 'asc' }],
  });
  return permissions;
};

export const getRolePermissions = async (role: string) => {
  let permissions = await prisma.rolePermission.findMany({
    where: { role },
    orderBy: { module: 'asc' },
  });

  if (permissions.length === 0) {
    await seedRolePermissions(role);
    permissions = await prisma.rolePermission.findMany({
      where: { role },
      orderBy: { module: 'asc' },
    });
  }

  return permissions;
};

export const updateRolePermission = async (
  role: string,
  module: string,
  data: { canView?: boolean; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; canExport?: boolean }
) => {
  return prisma.rolePermission.upsert({
    where: { role_module: { role, module } },
    update: data,
    create: { role, module, ...data },
  });
};

export const updateRolePermissions = async (role: string, permissions: Array<{ module: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean }>) => {
  const operations = permissions.map((p) =>
    prisma.rolePermission.upsert({
      where: { role_module: { role, module: p.module } },
      update: { canView: p.canView, canCreate: p.canCreate, canEdit: p.canEdit, canDelete: p.canDelete, canExport: p.canExport },
      create: { role, module: p.module, canView: p.canView, canCreate: p.canCreate, canEdit: p.canEdit, canDelete: p.canDelete, canExport: p.canExport },
    })
  );

  return prisma.$transaction(operations);
};

export const deleteRole = async (role: string) => {
  const userCount = await prisma.user.count({ where: { role: role as never } });
  if (userCount > 0) {
    throw new Error(`Cannot delete role "${role}": ${userCount} user(s) still have this role.`);
  }
  return prisma.rolePermission.deleteMany({ where: { role } });
};

export const createCustomRole = async (roleName: string, permissions: Array<{ module: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean }>) => {
  const existing = await prisma.rolePermission.findFirst({ where: { role: roleName } });
  if (existing) {
    throw new Error(`Role "${roleName}" already exists.`);
  }

  const operations = permissions.map((p) =>
    prisma.rolePermission.create({
      data: { role: roleName, module: p.module, canView: p.canView, canCreate: p.canCreate, canEdit: p.canEdit, canDelete: p.canDelete, canExport: p.canExport },
    })
  );

  return prisma.$transaction(operations);
};

export const getModules = () => DEFAULT_MODULES;

export const getAllRoles = async () => {
  const roles = await prisma.rolePermission.findMany({
    select: { role: true },
    distinct: ['role'],
    orderBy: { role: 'asc' },
  });
  return roles.map((r) => r.role);
};

export const getUserPermissions = async (role: string) => {
  let permissions = await prisma.rolePermission.findMany({
    where: { role },
  });

  if (permissions.length === 0) {
    await seedRolePermissions(role);
    permissions = await prisma.rolePermission.findMany({
      where: { role },
    });
  }

  const result: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean }> = {};
  for (const p of permissions) {
    result[p.module] = {
      canView: p.canView,
      canCreate: p.canCreate,
      canEdit: p.canEdit,
      canDelete: p.canDelete,
      canExport: p.canExport,
    };
  }
  return result;
};

const seedRolePermissions = async (role: string) => {
  const defaults = DEFAULT_PERMISSIONS[role];
  if (!defaults) return;

  const entries = Object.entries(defaults) as [string, PermData][];
  const operations = entries.map(([module, perms]) =>
    prisma.rolePermission.upsert({
      where: { role_module: { role, module } },
      update: perms,
      create: { role, module, ...perms },
    })
  );

  await prisma.$transaction(operations);
};

export const seedAllDefaults = async () => {
  for (const role of Object.keys(DEFAULT_PERMISSIONS)) {
    await seedRolePermissions(role);
  }
};
