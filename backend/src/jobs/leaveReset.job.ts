import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const scheduleLeaveReset = () => {
  cron.schedule('1 0 1 1 *', async () => {
    const newYear = new Date().getFullYear();
    const previousYear = newYear - 1;

    console.log(`Running leave balance reset for year ${newYear}...`);

    try {
      const activeUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const leaveTypes = await prisma.leaveType.findMany();

      for (const user of activeUsers) {
        for (const lt of leaveTypes) {
          let allocated = lt.defaultDays;

          if (lt.carryForward && lt.maxCarryForward > 0) {
            const prevBalance = await prisma.leaveBalance.findUnique({
              where: {
                userId_leaveTypeId_year: {
                  userId: user.id,
                  leaveTypeId: lt.id,
                  year: previousYear,
                },
              },
            });

            if (prevBalance && prevBalance.remaining > 0) {
              const carryForward = Math.min(prevBalance.remaining, lt.maxCarryForward);
              allocated += carryForward;
            }
          }

          await prisma.leaveBalance.upsert({
            where: {
              userId_leaveTypeId_year: {
                userId: user.id,
                leaveTypeId: lt.id,
                year: newYear,
              },
            },
            update: {
              allocated,
              used: 0,
              remaining: allocated,
            },
            create: {
              userId: user.id,
              leaveTypeId: lt.id,
              year: newYear,
              allocated,
              used: 0,
              remaining: allocated,
            },
          });
        }
      }

      console.log(`Leave balances reset successfully for year ${newYear}`);
    } catch (error) {
      console.error('Leave reset job failed:', error);
    }
  });

  console.log('Leave reset job scheduled for January 1st at 00:01');
};
