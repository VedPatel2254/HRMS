import { PrismaClient, Role, EmploymentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);
  const hrPasswordHash = await bcrypt.hash('Hr@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@prsecurity.in' },
    update: {},
    create: {
      employeeId: 'PRS-000',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@prsecurity.in',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      phone: '+919876543210',
      dateOfJoining: new Date('2024-01-01'),
      designation: 'System Administrator',
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  const hr = await prisma.user.upsert({
    where: { email: 'hr@prsecurity.in' },
    update: {},
    create: {
      employeeId: 'PRS-001',
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr@prsecurity.in',
      passwordHash: hrPasswordHash,
      role: Role.HR,
      phone: '+919876543211',
      dateOfJoining: new Date('2024-01-15'),
      designation: 'HR Manager',
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  await prisma.salaryStructure.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      basicSalary: 50000,
      hra: 20000,
      travelAllowance: 5000,
      medicalAllowance: 3000,
      otherAllowances: 2000,
      pfEmployeePercent: 12,
      pfEmployerPercent: 12,
      esiEmployeePercent: 0.75,
      esiEmployerPercent: 3.25,
      tdsPercent: 10,
    },
  });

  await prisma.salaryStructure.upsert({
    where: { userId: hr.id },
    update: {},
    create: {
      userId: hr.id,
      basicSalary: 50000,
      hra: 20000,
      travelAllowance: 5000,
      medicalAllowance: 3000,
      otherAllowances: 2000,
      pfEmployeePercent: 12,
      pfEmployerPercent: 12,
      esiEmployeePercent: 0.75,
      esiEmployerPercent: 3.25,
      tdsPercent: 10,
    },
  });

  const currentYear = new Date().getFullYear();

  const holidays = [
    { name: 'Republic Day', date: new Date(`${currentYear}-01-26`), type: 'NATIONAL' },
    { name: 'Maha Shivaratri', date: new Date(`${currentYear}-03-01`), type: 'OPTIONAL' },
    { name: 'Holi', date: new Date(`${currentYear}-03-14`), type: 'OPTIONAL' },
    { name: 'Good Friday', date: new Date(`${currentYear}-04-18`), type: 'NATIONAL' },
    { name: 'Ambedkar Jayanti', date: new Date(`${currentYear}-04-14`), type: 'NATIONAL' },
    { name: 'May Day', date: new Date(`${currentYear}-05-01`), type: 'COMPANY' },
    { name: 'Independence Day', date: new Date(`${currentYear}-08-15`), type: 'NATIONAL' },
    { name: 'Ganesh Chaturthi', date: new Date(`${currentYear}-08-27`), type: 'OPTIONAL' },
    { name: 'Gandhi Jayanti', date: new Date(`${currentYear}-10-02`), type: 'NATIONAL' },
    { name: 'Dussehra', date: new Date(`${currentYear}-10-20`), type: 'OPTIONAL' },
    { name: 'Diwali', date: new Date(`${currentYear}-11-08`), type: 'OPTIONAL' },
    { name: 'Christmas', date: new Date(`${currentYear}-12-25`), type: 'NATIONAL' },
  ];

  for (const holiday of holidays) {
    await prisma.holidayCalendar.create({
      data: {
        name: holiday.name,
        date: holiday.date,
        type: holiday.type,
        year: currentYear,
      },
    });
  }

  const leaveTypes = [
    { name: 'Casual Leave', code: 'CL', defaultDays: 12, isPaid: true, carryForward: false, maxCarryForward: 0, description: 'For personal work and casual purposes' },
    { name: 'Sick Leave', code: 'SL', defaultDays: 12, isPaid: true, carryForward: false, maxCarryForward: 0, description: 'For medical emergencies and health issues' },
    { name: 'Earned Leave', code: 'EL', defaultDays: 15, isPaid: true, carryForward: true, maxCarryForward: 30, description: 'Earned leave with carry forward facility' },
    { name: 'Comp Off', code: 'CO', defaultDays: 0, isPaid: true, carryForward: false, maxCarryForward: 0, description: 'Compensatory off for extra working days' },
    { name: 'Maternity Leave', code: 'ML', defaultDays: 180, isPaid: true, carryForward: false, maxCarryForward: 0, description: 'Maternity leave as per government policy' },
    { name: 'Paternity Leave', code: 'PL', defaultDays: 15, isPaid: true, carryForward: false, maxCarryForward: 0, description: 'Paternity leave for new fathers' },
    { name: 'Unpaid Leave', code: 'UL', defaultDays: 999, isPaid: false, carryForward: false, maxCarryForward: 0, description: 'Leave without pay' },
    { name: 'Optional Holiday', code: 'OH', defaultDays: 2, isPaid: true, carryForward: false, maxCarryForward: 0, description: 'Optional holidays of your choice' },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: lt,
    });
  }

  const allLeaveTypes = await prisma.leaveType.findMany();
  const users = [admin, hr];

  for (const user of users) {
    for (const lt of allLeaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          userId_leaveTypeId_year: {
            userId: user.id,
            leaveTypeId: lt.id,
            year: currentYear,
          },
        },
        update: {},
        create: {
          userId: user.id,
          leaveTypeId: lt.id,
          year: currentYear,
          allocated: lt.defaultDays,
          used: 0,
          remaining: lt.defaultDays,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
  console.log('Admin: admin@prsecurity.in / Admin@1234');
  console.log('HR: hr@prsecurity.in / Hr@1234');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
