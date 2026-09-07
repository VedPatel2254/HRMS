import { useState, useEffect } from 'react';
import { Users, Calendar, Loader2, Search, Download, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import ManualEntryModal from '../../components/attendance/ManualEntryModal';
import * as attendanceApi from '../../api/attendance.api';
import toast from 'react-hot-toast';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  workingHours: number | null;
  status: string;
  isManualEntry: boolean;
  user: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
}

interface AttendanceStats {
  present: number;
  absent: number;
  onLeave: number;
  total: number;
}

const TeamAttendancePage = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        attendanceApi.getAllAttendance({
          date: selectedDate,
          status: statusFilter || undefined,
          page: currentPage,
          limit: 20,
        }),
        attendanceApi.getAttendanceStats(),
      ]);

      setRecords(recordsRes.data.data);
      setTotalPages(recordsRes.data.totalPages);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, statusFilter, currentPage]);

  const handleManualEntry = async (data: {
    userId: string;
    date: string;
    status: string;
    punchIn?: string;
    punchOut?: string;
    notes?: string;
  }) => {
    try {
      await attendanceApi.manualAttendanceEntry(data);
      toast.success('Attendance entry saved');
      setShowManualEntry(false);
      fetchData();
    } catch {
      toast.error('Failed to save attendance entry');
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      r.user.employeeId.toLowerCase().includes(search) ||
      r.user.firstName.toLowerCase().includes(search) ||
      r.user.lastName.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      key: 'user',
      header: 'Employee',
      render: (row: AttendanceRecord) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-sm font-medium text-accent">
              {row.user.firstName[0]}{row.user.lastName[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {row.user.firstName} {row.user.lastName}
            </p>
            <p className="text-xs text-gray-500">{row.user.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: AttendanceRecord) => <StatusBadge status={row.status} type="attendance" />,
    },
    {
      key: 'punchIn',
      header: 'Punch In',
      render: (row: AttendanceRecord) =>
        row.punchIn ? (
          <span className="text-green-600 font-medium">
            {new Date(row.punchIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      key: 'punchOut',
      header: 'Punch Out',
      render: (row: AttendanceRecord) =>
        row.punchOut ? (
          <span className="text-red-600 font-medium">
            {new Date(row.punchOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      key: 'workingHours',
      header: 'Hours',
      render: (row: AttendanceRecord) =>
        row.workingHours ? (
          <span className="font-medium text-gray-900 dark:text-white">{row.workingHours.toFixed(1)}h</span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      key: 'isManualEntry',
      header: 'Entry',
      render: (row: AttendanceRecord) =>
        row.isManualEntry ? (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
            <AlertTriangle className="w-3 h-3" />
            Manual
          </span>
        ) : (
          <span className="text-xs text-gray-500">Auto</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Attendance"
        subtitle="View and manage team attendance records"
        icon={<Users className="w-5 h-5" />}
        action={
          <button
            onClick={() => setShowManualEntry(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Manual Entry
          </button>
        }
      />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.present}</p>
              </div>
            </div>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.absent}</p>
              </div>
            </div>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">On Leave</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.onLeave}</p>
              </div>
            </div>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={filteredRecords}
            emptyMessage="No attendance records found"
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showManualEntry && (
        <ManualEntryModal
          onClose={() => setShowManualEntry(false)}
          onSubmit={handleManualEntry}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default TeamAttendancePage;
