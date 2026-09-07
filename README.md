# PRSECURITY HRMS

Human Resource Management System for PRSECURITY CONSULTANCY & SERVICES

## Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- PostgreSQL 15+ (or use Docker)
- npm or yarn
- Docker & Docker Compose (optional, for database)

## Quick Start

### 1. Start Database

```bash
# Using Docker
docker-compose up -d

# Verify
docker ps
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example or use provided .env)
cp .env.example .env

# Run Prisma migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- pgAdmin: http://localhost:5050

## Default Credentials

| Role  | Email                | Password   |
|-------|----------------------|------------|
| ADMIN | admin@prsecurity.in  | Admin@1234 |
| HR    | hr@prsecurity.in     | Hr@1234    |

## Environment Variables

### Backend (.env)

```
DATABASE_URL="postgresql://prsecurity:prsecurity@123@localhost:5432/prsecurity_hrms"
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Project Structure

```
prsecurity-hrms/
├── frontend/          # React + Vite + TypeScript
│   └── src/
│       ├── api/       # API client and functions
│       ├── components # UI components
│       ├── hooks/     # Custom React hooks
│       ├── pages/     # Page components
│       ├── routes/    # Route protection
│       ├── store/     # Zustand state management
│       ├── types/     # TypeScript interfaces
│       └── utils/     # Helper functions
├── backend/           # Express + TypeScript
│   └── src/
│       ├── controllers/  # Route handlers
│       ├── middleware/    # Auth, role guard, error handler
│       ├── routes/       # Express routers
│       ├── services/     # Business logic
│       └── utils/        # JWT, response helpers
├── docker-compose.yml
└── README.md
```

## Phase 1 Features

- PostgreSQL database with Prisma ORM
- JWT authentication (access + refresh tokens)
- Role-based access control (ADMIN, HR, EMPLOYEE, INTERN)
- Login page with form validation
- Forgot password flow
- Reset password flow
- Responsive sidebar navigation
- Dark mode support
- Protected routes with role guards

## What's Included in Phase 1

- Complete database schema with all models
- Seed data (Admin + HR accounts)
- Authentication system (login, logout, refresh, password reset)
- Frontend layout (sidebar, topbar, main content)
- All route placeholders for future phases

## API Endpoints

### Authentication

| Method | Endpoint                    | Description         | Auth Required |
|--------|-----------------------------|---------------------|---------------|
| POST   | /api/auth/login             | Login               | No            |
| POST   | /api/auth/refresh           | Refresh token       | Cookie        |
| POST   | /api/auth/logout            | Logout              | Yes           |
| GET    | /api/auth/me                | Get current user    | Yes           |
| POST   | /api/auth/change-password   | Change password     | Yes           |
| POST   | /api/auth/forgot-password   | Request reset link  | No            |
| POST   | /api/auth/reset-password/:token | Reset password | No            |

## License

Internal use only - PRSECURITY CONSULTANCY & SERVICES
