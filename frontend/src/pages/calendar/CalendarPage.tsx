import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import TeamLeaveCalendar from '../../components/leave/TeamLeaveCalendar';
import TaskCalendar from '../../components/tasks/TaskCalendar';
import * as leaveApi from '../../api/leave.api';
import * as taskApi from '../../api/task.api';
import toast from 'react-hot-toast';

type TabType = 'leave' | 'tasks';

const CalendarPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('leave');
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [calendarLeaves, setCalendarLeaves] = useState<Array<{
    id: string;
    fromDate: string;
    toDate: string;
    totalDays: number;
    user: { id: string; firstName: string; lastName: string; profilePicture: string | null };
    leaveType: { name: string; code: string };
  }>>([]);

  const [tasks, setTasks] = useState<Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    assignee: { id: string; firstName: string; lastName: string; profilePicture: string | null };
    project: { id: string; name: string } | null;
  }>>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leaveRes, taskRes] = await Promise.all([
        leaveApi.getTeamLeaveCalendar(currentMonth, currentYear),
        taskApi.getAllTasks(),
      ]);
      setCalendarLeaves((leaveRes.data as any) || []);
      setTasks(taskRes.data?.data || []);
    } catch {
      toast.error('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth, currentYear]);

  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="View team leaves and task deadlines"
      />

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'leave'
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Leave Calendar
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Work Tasks
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : activeTab === 'leave' ? (
            <TeamLeaveCalendar
              leaves={calendarLeaves}
              month={currentMonth}
              year={currentYear}
              onMonthChange={handleMonthChange}
            />
          ) : (
            <TaskCalendar
              tasks={tasks}
              month={currentMonth}
              year={currentYear}
              onMonthChange={handleMonthChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
