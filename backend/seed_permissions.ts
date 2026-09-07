import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_MODULES = [
  'dashboard', 'employees', 'attendance', 'leave', 'payroll',
  'tasks', 'projects', 'clients', 'recruitment', 'performance',
  'assets', 'expenses', 'announcements', 'helpdesk', 'reports',
  'settings', 'profile',
];

const DEFAULT_PERMISSIONS: Record<string, Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean }>> = {
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

async function main() {
  console.log('Seeding role permissions...');
  for (const [role, modules] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const [module, perms] of Object.entries(modules)) {
      await prisma.rolePermission.upsert({
        where: { role_module: { role, module } },
        update: perms,
        create: { role, module, ...perms },
      });
    }
    console.log(`  Seeded ${role} permissions`);
  }
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
