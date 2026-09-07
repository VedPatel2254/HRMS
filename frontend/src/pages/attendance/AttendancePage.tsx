import { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import PunchWidget from '../../components/attendance/PunchWidget';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import AttendanceSummaryCard from '../../components/attendance/AttendanceSummaryCard';
import { useAuthStore } from '../../store/authStore';
import * as attendanceApi from '../../api/attendance.api';
import toast from 'react-hot-toast';

const AttendancePage = () => {
  const { user } = useAuthStore();
  const [todayAttendance, setTodayAttendance] = useState<{
    punchIn: string | null;
    punchOut: string | null;
    workingHours: number | null;
    status: string;
  } | null>(null);
  const [calendarRecords, setCalendarRecords] = useState<Array<{
    date: string;
    status: string;
    punchIn: string | null;
    punchOut: string | null;
    workingHours: number | null;
    isHoliday: boolean;
    holidayName?: string;
  }>>([]);
  const [summary, setSummary] = useState({
    workingDays: 0,
    presentDays: 0,
    absentDays: 0,
    halfDays: 0,
    leaveDays: 0,
    attendancePercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchData = async (month: number, year: number) => {
    setIsLoading(true);
    try {
      const [todayRes, recordsRes, summaryRes] = await Promise.all([
        attendanceApi.getTodayAttendance(),
        attendanceApi.getMyAttendance(month, year),
        attendanceApi.getMySummary(month, year),
      ]);

      setTodayAttendance(todayRes.data);
      setCalendarRecords(recordsRes.data);
      setSummary(summaryRes.data);
    } catch {
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  const handlePunchIn = async (lat?: number, long?: number) => {
    try {
      await attendanceApi.punchIn(lat, long);
      toast.success('Punched in successfully');
      await fetchData(currentMonth, currentYear);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Punch in failed';
      toast.error(message);
    }
  };

  const handlePunchOut = async (lat?: number, long?: number) => {
    try {
      await attendanceApi.punchOut(lat, long);
      toast.success('Punched out successfully');
      await fetchData(currentMonth, currentYear);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Punch out failed';
      toast.error(message);
    }
  };

  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  if (isLoading && !todayAttendance) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Calendar className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attendance</h1>
          <p className="text-sm text-gray-500">Track your daily attendance and work hours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <PunchWidget
            todayAttendance={todayAttendance}
            onPunchIn={handlePunchIn}
            onPunchOut={handlePunchOut}
          />
          <AttendanceSummaryCard
            workingDays={summary.workingDays}
            presentDays={summary.presentDays}
            absentDays={summary.absentDays}
            halfDays={summary.halfDays}
            leaveDays={summary.leaveDays}
            attendancePercentage={summary.attendancePercentage}
          />
        </div>

        <div className="lg:col-span-2">
          <AttendanceCalendar
            records={calendarRecords}
            month={currentMonth}
            year={currentYear}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
