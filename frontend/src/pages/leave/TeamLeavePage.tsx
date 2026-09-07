import { useState, useEffect } from 'react';
import { Calendar, Users, Loader2, Check, X } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import LeaveRequestTable from '../../components/leave/LeaveRequestTable';
import TeamLeaveCalendar from '../../components/leave/TeamLeaveCalendar';
import * as leaveApi from '../../api/leave.api';
import toast from 'react-hot-toast';

interface LeaveType {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
  isPaid: boolean;
  carryForward: boolean;
  maxCarryForward: number;
  description: string | null;
}

interface LeaveBalanceRow {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  balances: Array<{
    leaveType: string;
    code: string;
    allocated: number;
    used: number;
    remaining: number;
  }>;
}

const TeamLeavePage = () => {
  const [pendingRequests, setPendingRequests] = useState<Array<{
    id: string;
    user: { employeeId: string; firstName: string; lastName: string };
    leaveType: { name: string; code: string };
    fromDate: string;
    toDate: string;
    totalDays: number;
    reason: string;
    status: string;
    createdAt: string;
  }>>([]);
  const [allRequests, setAllRequests] = useState<Array<{
    id: string;
    user: { employeeId: string; firstName: string; lastName: string };
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
  const [teamBalances, setTeamBalances] = useState<LeaveBalanceRow[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'calendar' | 'balances' | 'types'>('pending');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newType, setNewType] = useState({
    name: '',
    code: '',
    defaultDays: 0,
    isPaid: true,
    carryForward: false,
    maxCarryForward: 0,
    description: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, allRes, calendarRes, balancesRes, typesRes] = await Promise.all([
        leaveApi.getAllLeaveRequests({ status: 'PENDING' }),
        leaveApi.getAllLeaveRequests(),
        leaveApi.getTeamLeaveCalendar(currentMonth, currentYear),
        leaveApi.getTeamLeaveBalance(),
        leaveApi.getLeaveTypes(),
      ]);
      setPendingRequests(pendingRes.data.data);
      setAllRequests(allRes.data.data);
      setCalendarLeaves(calendarRes.data);
      setTeamBalances(balancesRes.data);
      setLeaveTypes(typesRes.data);
    } catch {
      toast.error('Failed to load leave data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth, currentYear]);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this leave request?')) return;
    try {
      await leaveApi.approveLeave(id);
      toast.success('Leave approved');
      fetchData();
    } catch {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async () => {
    if (!showRejectModal || !rejectNote.trim()) return;
    try {
      await leaveApi.rejectLeave(showRejectModal, rejectNote);
      toast.success('Leave rejected');
      setShowRejectModal(null);
      setRejectNote('');
      fetchData();
    } catch {
      toast.error('Failed to reject leave');
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leaveApi.createLeaveType(newType);
      toast.success('Leave type created');
      setShowAddTypeModal(false);
      setNewType({ name: '', code: '', defaultDays: 0, isPaid: true, carryForward: false, maxCarryForward: 0, description: '' });
      fetchData();
    } catch {
      toast.error('Failed to create leave type');
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
        title="Leave Management"
        subtitle="Manage team leave requests and balances"
        icon={<Users className="w-5 h-5" />}
      />

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'pending', label: `Pending (${pendingRequests.length})` },
            { id: 'all', label: 'All Requests' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'balances', label: 'Balances' },
            { id: 'types', label: 'Leave Types' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'pending' && (
            <LeaveRequestTable
              requests={pendingRequests}
              showEmployee
              onApprove={handleApprove}
              onReject={(id) => setShowRejectModal(id)}
            />
          )}

          {activeTab === 'all' && (
            <LeaveRequestTable
              requests={allRequests}
              showEmployee
            />
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

          {activeTab === 'balances' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                    {leaveTypes.map((lt) => (
                      <th key={lt.code} className="text-center py-3 px-2 text-sm font-medium text-gray-500">
                        {lt.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamBalances.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {row.firstName} {row.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{row.employeeId}</p>
                      </td>
                      {leaveTypes.map((lt) => {
                        const balance = row.balances.find((b) => b.code === lt.code);
                        return (
                          <td key={lt.code} className="text-center py-3 px-2">
                            <div className="text-sm">
                              <span className="text-green-600">{balance?.remaining || 0}</span>
                              <span className="text-gray-400"> / </span>
                              <span className="text-gray-500">{balance?.allocated || 0}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'types' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => setShowAddTypeModal(true)}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Add Leave Type
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaveTypes.map((lt) => (
                  <div
                    key={lt.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{lt.name}</h4>
                      <span className="px-2 py-0.5 text-xs font-bold bg-accent/10 text-accent rounded">
                        {lt.code}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{lt.defaultDays} days</p>
                    <div className="flex gap-2">
                      {lt.isPaid && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/20 text-green-600 rounded">
                          Paid
                        </span>
                      )}
                      {lt.carryForward && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded">
                          Carry Forward
                        </span>
                      )}
                    </div>
                    {lt.description && (
                      <p className="text-xs text-gray-400 mt-2">{lt.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <Modal onClose={() => { setShowRejectModal(null); setRejectNote(''); }}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reject Leave</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for rejection *
              </label>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Enter reason..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(null); setRejectNote(''); }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectNote.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAddTypeModal && (
        <Modal onClose={() => setShowAddTypeModal(false)}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Leave Type</h2>
            <form onSubmit={handleAddType} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={newType.code}
                    onChange={(e) => setNewType({ ...newType, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Days *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newType.defaultDays}
                    onChange={(e) => setNewType({ ...newType, defaultDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newType.isPaid}
                    onChange={(e) => setNewType({ ...newType, isPaid: e.target.checked })}
                    className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Paid</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newType.carryForward}
                    onChange={(e) => setNewType({ ...newType, carryForward: e.target.checked })}
                    className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Carry Forward</span>
                </label>
              </div>
              {newType.carryForward && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Carry Forward</label>
                  <input
                    type="number"
                    min={0}
                    value={newType.maxCarryForward}
                    onChange={(e) => setNewType({ ...newType, maxCarryForward: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newType.description}
                  onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeamLeavePage;
