import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Calendar,
  LifeBuoy,
  FolderKanban,
  ClipboardCheck,
  Plus,
  Megaphone,
  Wallet,
  BarChart3,
  Download,
  Clock,
  CheckSquare,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { exportToCSV } from '../../utils/exportCSV';

interface DashboardData {
  totalEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  openTickets: number;
  activeProjects: number;
  pendingLeaveRequests: number;
  pendingExpenseClaims: number;
  recentEmployees: Array<{
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    designation: string;
    profilePicture: string | null;
    createdAt: string;
  }>;
  headcountByRole: Array<{ role: string; count: number }>;
}

interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    status: string;
  }>>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { default: api } = await import('../../api/axios');
        const [dashRes, leavesRes, tasksRes] = await Promise.allSettled([
          api.get('/dashboard/admin'),
          api.get('/leave?status=PENDING&limit=5'),
          api.get('/tasks?limit=5'),
        ]);

        console.log('[Dashboard] API responses:', {
          dash: dashRes.status === 'fulfilled' ? dashRes.value.data : dashRes.reason,
          leaves: leavesRes.status === 'fulfilled' ? leavesRes.value.data : leavesRes.reason,
          tasks: tasksRes.status === 'fulfilled' ? tasksRes.value.data : tasksRes.reason,
        });

        if (dashRes.status === 'fulfilled' && dashRes.value.data.success) {
          setData(dashRes.value.data.data);
        }
        if (leavesRes.status === 'fulfilled' && leavesRes.value.data.success) {
          setPendingLeaves(leavesRes.value.data.data?.leaves || leavesRes.value.data.data || []);
        }
        if (tasksRes.status === 'fulfilled' && tasksRes.value.data.success) {
          setUpcomingTasks(tasksRes.value.data.data?.data || tasksRes.value.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  const handleExport = () => {
    const rows = [
      {
        metric: 'Total Employees',
        value: data?.totalEmployees || 0,
      },
      {
        metric: 'Present Today',
        value: data?.presentToday || 0,
      },
      {
        metric: 'On Leave Today',
        value: data?.onLeaveToday || 0,
      },
      {
        metric: 'Open Tickets',
        value: data?.openTickets || 0,
      },
      {
        metric: 'Active Projects',
        value: data?.activeProjects || 0,
      },
      {
        metric: 'Pending Approvals',
        value: (data?.pendingLeaveRequests || 0) + (data?.pendingExpenseClaims || 0),
      },
      ...(data?.headcountByRole || []).map((r) => ({
        metric: `Role: ${r.role}`,
        value: r.count,
      })),
    ];
    exportToCSV(rows, `admin-dashboard-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div>
      <PageHeader
        title={`${getGreeting()}, ${user?.firstName}!`}
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        action={{
          label: 'Download Report',
          onClick: handleExport,
          icon: Download,
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="cursor-pointer" onClick={() => navigate('/employees')}>
          <StatCard title="Total Employees" value={data?.totalEmployees || 0} icon={Users} colorVariant="primary" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/attendance')}>
          <StatCard title="Present Today" value={data?.presentToday || 0} icon={UserCheck} colorVariant="success" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/leave')}>
          <StatCard title="On Leave Today" value={data?.onLeaveToday || 0} icon={Calendar} colorVariant="warning" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/helpdesk')}>
          <StatCard title="Open Tickets" value={data?.openTickets || 0} icon={LifeBuoy} colorVariant="danger" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/projects')}>
          <StatCard title="Active Projects" value={data?.activeProjects || 0} icon={FolderKanban} colorVariant="primary" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/leave')}>
          <StatCard title="Pending Approvals" value={(data?.pendingLeaveRequests || 0) + (data?.pendingExpenseClaims || 0)} icon={ClipboardCheck} colorVariant="warning" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Headcount by Role</h3>
          {data?.headcountByRole && data.headcountByRole.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.headcountByRole}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#00C2FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No data" description="No employee data available yet." icon={Users} />
          )}
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Employees</h3>
          {data?.recentEmployees && data.recentEmployees.length > 0 ? (
            <div className="space-y-3">
              {data.recentEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => navigate(`/employees/${emp.id}`)}>
                  <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.profilePicture} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-500">{emp.designation || emp.employeeId}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No employees" description="No employees added yet." icon={Users} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/employees/new')} className="flex items-center gap-3 p-3 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors">
              <Plus className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Add Employee</span>
            </button>
            <button onClick={() => navigate('/announcements')} className="flex items-center gap-3 p-3 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors">
              <Megaphone className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Post Announcement</span>
            </button>
            <button onClick={() => navigate('/payroll')} className="flex items-center gap-3 p-3 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors">
              <Wallet className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Run Payroll</span>
            </button>
            <button onClick={() => navigate('/reports')} className="flex items-center gap-3 p-3 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors">
              <BarChart3 className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">View Reports</span>
            </button>
          </div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Leave Requests</h3>
            <button
              onClick={() => navigate('/leave')}
              className="text-sm text-accent hover:text-accent-600 font-medium transition-colors"
            >
              View All
            </button>
          </div>
          {pendingLeaves.length > 0 ? (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{leave.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      {leave.leaveType} &middot; {new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <StatusBadge status={leave.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pending requests"
              description="All leave requests have been reviewed."
              icon={Calendar}
            />
          )}
        </div>
      </div>

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Tasks</h3>
          <button
            onClick={() => navigate('/tasks')}
            className="text-sm text-accent hover:text-accent-600 font-medium transition-colors"
          >
            View All
          </button>
        </div>
        {upcomingTasks.length > 0 ? (
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    Due {new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} &middot; {task.priority}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No upcoming tasks"
            description="No pending or in-progress tasks."
            icon={CheckSquare}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
