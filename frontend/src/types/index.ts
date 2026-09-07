export type Role = 'ADMIN' | 'HR' | 'EMPLOYEE' | 'INTERN' | 'SUPPORT' | 'TECH_LEAD' | string;
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'INTERN' | 'CONTRACT';

export interface User {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  phone?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  dateOfJoining: string;
  designation?: string;
  employmentType: EmploymentType;
  status: UserStatus;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  panNumber?: string;
  salaryStructure?: SalaryStructure;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructure {
  id: string;
  userId: string;
  basicSalary: number;
  hra: number;
  travelAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
  pfEmployeePercent: number;
  pfEmployerPercent: number;
  esiEmployeePercent: number;
  esiEmployerPercent: number;
  tdsPercent: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  punchIn?: string;
  punchOut?: string;
  punchInLat?: number;
  punchInLong?: number;
  punchOutLat?: number;
  punchOutLong?: number;
  punchInIP?: string;
  punchOutIP?: string;
  workingHours?: number;
  status: string;
  notes?: string;
  isManualEntry: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
  isPaid: boolean;
  description?: string;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  remaining: number;
  leaveType?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
  leaveType?: LeaveType;
  user?: User;
}

export interface Payroll {
  id: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  travelAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
  bonus: number;
  deductions: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  tds: number;
  grossSalary: number;
  netSalary: number;
  paymentStatus: string;
  paidAt?: string;
  workingDays: number;
  presentDays: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  assignedTo: string;
  assignedBy: string;
  priority: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  creator?: User;
  attachments?: TaskAttachment[];
  phases?: TaskPhase[];
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
  uploader?: { id: string; firstName: string; lastName: string };
}

export interface TaskPhase {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  status: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  id: string;
  role: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency: string;
  priority: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user?: User;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  gstin?: string;
  website?: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  department?: string;
  location?: string;
  type: string;
  status: string;
  salaryMin?: number;
  salaryMax?: number;
  openings: number;
  closingDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Applicant {
  id: string;
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
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  weight: number;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReview {
  id: string;
  userId: string;
  reviewerId: string;
  period: string;
  year: number;
  selfRating?: number;
  managerRating?: number;
  selfComments?: string;
  managerComments?: string;
  overallRating?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  serialNumber?: string;
  assignedTo?: string;
  assignedAt?: string;
  status: string;
  purchaseDate?: string;
  purchasePrice?: number;
  condition?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseClaim {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  receiptUrl?: string;
  date: string;
  status: string;
  reviewedBy?: string;
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetRoles: string[];
  postedBy: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  poster?: User;
}

export interface HelpdeskTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  raisedBy: string;
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  raiser?: User;
  assignee?: User;
}

export interface HolidayCalendar {
  id: string;
  name: string;
  date: string;
  type: string;
  year: number;
}
