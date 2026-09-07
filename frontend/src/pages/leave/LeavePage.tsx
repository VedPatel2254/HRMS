import { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import LeaveBalanceCards from '../../components/leave/LeaveBalanceCards';
import LeaveRequestForm from '../../components/leave/LeaveRequestForm';
import LeaveRequestTable from '../../components/leave/LeaveRequestTable';
import TeamLeaveCalendar from '../../components/leave/TeamLeaveCalendar';
import * as leaveApi from '../../api/leave.api';
import toast from 'react-hot-toast';

const LeavePage = () => {
  const [balances, setBalances] = useState<Array<{
    leaveType: { name: string; code: string };
    allocated: number;
    used: number;
    remaining: number;
  }>>([]);
  const [requests, setRequests] = useState<Array<{
    id: string;
    leaveType: { name: string; code: string };
    fromDate: string;
    toDate: string;
    totalDays: number;
    reason: string;
    status: string;
    createdAt: string;
  }>>([]);
  const [calendarLeaves, setCalendarLeaves] = useState<Array<{
    id: string;
    fromDate: string;
    toDate: string;
    totalDays: number;
    user: { id: string; firstName: string; lastName: string; profilePicture: string | null };
    leaveType: { name: string; code: string };
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar'>('requests');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balanceRes, requestsRes, calendarRes] = await Promise.all([
        leaveApi.getMyLeaveBalance(),
        leaveApi.getMyLeaveRequests({ status: statusFilter || undefined }),
        leaveApi.getTeamLeaveCalendar(currentMonth, currentYear),
      ]);
      setBalances(balanceRes.data);
      setRequests(requestsRes.data.data);
      setCalendarLeaves(calendarRes.data);
    } catch {
      toast.error('Failed to load leave data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, currentMonth, currentYear]);

  const handleApplyLeave = async (data: {
    leaveTypeId: string;
    fromDate: string;
    toDate: string;
    reason: string;
  }) => {
    try {
      await leaveApi.applyLeave(data);
      toast.success('Leave applied successfully');
      setShowApplyModal(false);
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply leave';
      toast.error(message);
      throw error;
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await leaveApi.cancelLeave(id);
      toast.success('Leave cancelled');
      fetchData();
    } catch {
      toast.error('Failed to cancel leave');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leave"
        subtitle="Manage your leave requests and view balance"
        icon={<Calendar className="w-5 h-5" />}
        action={
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Apply Leave
          </button>
        }
      />

      <LeaveBalanceCards balances={balances} />

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Leave Calendar
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'requests' && (
            <>
              <div className="mb-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <LeaveRequestTable
                requests={requests}
                onCancel={handleCancelLeave}
              />
            </>
          )}

          {activeTab === 'calendar' && (
            <TeamLeaveCalendar
              leaves={calendarLeaves}
              month={currentMonth}
              year={currentYear}
              onMonthChange={(month, year) => {
                setCurrentMonth(month);
                setCurrentYear(year);
              }}
            />
          )}
        </div>
      </div>

      {showApplyModal && (
        <Modal onClose={() => setShowApplyModal(false)}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Apply for Leave
            </h2>
            <LeaveRequestForm
              onSubmit={handleApplyLeave}
              onCancel={() => setShowApplyModal(false)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeavePage;
