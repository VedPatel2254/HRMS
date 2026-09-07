import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayRecord {
  date: string;
  status: string;
  punchIn: string | null;
  punchOut: string | null;
  workingHours: number | null;
  isHoliday: boolean;
  holidayName?: string;
}

interface AttendanceCalendarProps {
  records: DayRecord[];
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

const statusColors: Record<string, string> = {
  PRESENT: 'bg-green-500 text-white',
  ABSENT: 'bg-red-500 text-white',
  HALF_DAY: 'bg-yellow-500 text-white',
  ON_LEAVE: 'bg-blue-500 text-white',
  WEEKEND: 'bg-gray-200 dark:bg-gray-700 text-gray-500',
  HOLIDAY: 'bg-purple-500 text-white',
  FUTURE: 'bg-gray-100 dark:bg-gray-800 text-gray-400',
};

const statusInitials: Record<string, string> = {
  PRESENT: 'P',
  ABSENT: 'A',
  HALF_DAY: 'H',
  ON_LEAVE: 'L',
  WEEKEND: 'W',
  HOLIDAY: 'Ho',
  FUTURE: '',
};

const AttendanceCalendar = ({ records, month, year, onMonthChange }: AttendanceCalendarProps) => {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const handlePrev = () => {
    if (month === 1) {
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{monthName}</h3>
        <button
          onClick={handleNext}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const record = records.find((r) => {
            const rDate = new Date(r.date);
            const rStr = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}-${String(rDate.getDate()).padStart(2, '0')}`;
            return rStr === dateStr;
          });

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const cellDate = new Date(year, month - 1, day);
          const isFuture = cellDate > today;

          const status = isFuture ? 'FUTURE' : (record?.status || 'ABSENT');
          const colorClass = statusColors[status] || statusColors.ABSENT;
          const initial = statusInitials[status] ?? '?';

          return (
            <div
              key={day}
              className="aspect-square relative group"
              title={`${dateStr}: ${status}${record?.workingHours ? ` (${record.workingHours}h)` : ''}`}
            >
              <div className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-xs ${colorClass}`}>
                <span className="font-medium">{day}</span>
                <span className="text-[10px] leading-none">{initial}</span>
              </div>

              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                  <p className="font-medium">{dateStr}</p>
                  <p>Status: {status.replace(/_/g, ' ')}</p>
                  {record?.punchIn && <p>In: {new Date(record.punchIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                  {record?.punchOut && <p>Out: {new Date(record.punchOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                  {record?.workingHours && <p>Hours: {record.workingHours}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-xs text-gray-500">Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-xs text-gray-500">Absent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-xs text-gray-500">Half Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-xs text-gray-500">Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-300" />
          <span className="text-xs text-gray-500">Weekend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-xs text-gray-500">Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
          <span className="text-xs text-gray-500">Future</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
