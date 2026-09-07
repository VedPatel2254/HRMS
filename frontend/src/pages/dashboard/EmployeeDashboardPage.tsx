import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  CheckSquare,
  Wallet,
  Megaphone,
  LogIn,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import EmptyState from '../../components/shared/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import PunchWidget from '../../components/attendance/PunchWidget';
import { useAuth } from '../../hooks/useAuth';
import * as attendanceApi from '../../api/attendance.api';
import { formatINR } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

interface DashboardData {
  todayAttendance: {
    punchIn: string | null;
    punchOut: string | null;
    status: string;
  } | null;
  leaveBalance: Array<{
    id: string;
    leaveType: string;
    code: string;
    allocated: number;
    used: number;
    remaining: number;
  }>;
  taskStats: {
    todo: number;
    inProgress: number;
    done: number;
  };
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    priority: string;
    postedBy: string;
    createdAt: string;
  }>;
  latestPayslip: {
    id: string;
    month: number;
    year: number;
    netSalary: number;
    paymentStatus: string;
  } | null;
}

const EmployeeDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        const response = await api.get('/dashboard/employee');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handlePunchIn = async (lat?: number, long?: number) => {
    try {
      await attendanceApi.punchIn(lat, long);
      toast.success('Punched in successfully');
      const { default: api } = await import('../../api/axios');
      const response = await api.get('/dashboard/employee');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Punch in failed';
      toast.error(message);
    }
  };

  const handlePunchOut = async (lat?: number, long?: number) => {
    try {
      await attendanceApi.punchOut(lat, long);
      toast.success('Punched out successfully');
      const { default: api } = await import('../../api/axios');
      const response = await api.get('/dashboard/employee');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Punch out failed';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${getGreeting()}, ${user?.firstName}!`}
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="cursor-pointer">
          <StatCard
            title="Today's Status"
            value={data?.todayAttendance?.status || 'Not Marked'}
            icon={data?.todayAttendance?.punchIn ? LogIn : Clock}
            colorVariant={data?.todayAttendance?.status === 'PRESENT' ? 'success' : 'warning'}
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/leave')}>
          <StatCard
            title="Leave Balance"
            value={data?.leaveBalance?.reduce((sum, lb) => sum + lb.remaining, 0) || 0}
            icon={Calendar}
            colorVariant="primary"
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/tasks')}>
          <StatCard
            title="My Tasks"
            value={(data?.taskStats?.todo || 0) + (data?.taskStats?.inProgress || 0)}
            icon={CheckSquare}
            colorVariant="warning"
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/tasks')}>
          <StatCard
            title="Completed Tasks"
            value={data?.taskStats?.done || 0}
            icon={CheckSquare}
            colorVariant="success"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PunchWidget
          todayAttendance={data?.todayAttendance || null}
          onPunchIn={handlePunchIn}
          onPunchOut={handlePunchOut}
        />

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leave Balance</h3>
          {data?.leaveBalance && data.leaveBalance.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {data.leaveBalance.map((lb) => (
                <div key={lb.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">{lb.code}</span>
                    <span className="text-xs text-gray-400">{lb.leaveType}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-accent">{lb.remaining}</span>
                    <span className="text-xs text-gray-400">/ {lb.allocated}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No leave data" description="Leave balance will appear here." icon={Calendar} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Tasks</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">To Do</span>
              <span className="text-lg font-bold text-yellow-600">{data?.taskStats?.todo || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
              <span className="text-lg font-bold text-accent">{data?.taskStats?.inProgress || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Done</span>
              <span className="text-lg font-bold text-green-600">{data?.taskStats?.done || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Announcements</h3>
          {data?.announcements && data.announcements.length > 0 ? (
            <div className="space-y-3">
              {data.announcements.map((ann) => (
                <div key={ann.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={ann.priority} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{ann.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{ann.content}</p>
                  <p className="text-xs text-gray-400 mt-1">By {ann.postedBy}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No announcements" description="No new announcements at the moment." icon={Megaphone} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;
