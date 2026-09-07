import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import attendanceRoutes from './routes/attendance.routes';
import leaveRoutes from './routes/leave.routes';
import payrollRoutes from './routes/payroll.routes';
import clientRoutes from './routes/client.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import recruitmentRoutes from './routes/recruitment.routes';
import performanceRoutes from './routes/performance.routes';
import assetRoutes from './routes/asset.routes';
import expenseRoutes from './routes/expense.routes';
import announcementRoutes from './routes/announcement.routes';
import helpdeskRoutes from './routes/helpdesk.routes';
import reportRoutes from './routes/report.routes';
import settingsRoutes from './routes/settings.routes';
import rolePermissionRoutes from './routes/rolePermission.routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { scheduleLeaveReset } from './jobs/leaveReset.job';

dotenv.config();

const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  /https:\/\/.*\.ngrok-free\.app$/,
  /https:\/\/.*\.ngrok-free\.dev$/,
  /https:\/\/.*\.vercel\.app$/,
];

if (isProduction && process.env.PRODUCTION_URL) {
  allowedOrigins.push(process.env.PRODUCTION_URL);
}

export const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
}));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

if (isProduction) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/tickets', helpdeskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/role-permissions', rolePermissionRoutes);

if (isProduction) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }
}

app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully.');

    scheduleLeaveReset();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

startServer();
