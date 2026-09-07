import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface LeaveRequest {
  id: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
  leaveType: {
    name: string;
    code: string;
  };
}

interface TeamLeaveCalendarProps {
  leaves: LeaveRequest[];
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

const TeamLeaveCalendar = ({ leaves, month, year, onMonthChange }: TeamLeaveCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const getLeavesForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.filter((leave) => {
      const from = new Date(leave.fromDate).toISOString().split('T')[0];
      const to = new Date(leave.toDate).toISOString().split('T')[0];
      return dateStr >= from && dateStr <= to;
    });
  };

  const selectedLeaves = selectedDate ? getLeavesForDay(parseInt(selectedDate)) : [];

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
          const dayLeaves = getLeavesForDay(day);
          const isSelected = selectedDate === String(day);
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() + 1 === month &&
            new Date().getFullYear() === year;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : String(day))}
              className={`aspect-square rounded-lg flex flex-col items-center justify-start p-1 transition-colors ${
                isSelected
                  ? 'bg-accent text-white'
                  : isToday
                  ? 'bg-accent/10 text-accent'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {day}
              </span>
              {dayLeaves.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayLeaves.slice(0, 3).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-blue-500'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {new Date(year, month - 1, parseInt(selectedDate)).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {selectedLeaves.length === 0 ? (
            <p className="text-sm text-gray-500">No leaves on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-accent">
                      {leave.user.firstName[0]}
                      {leave.user.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {leave.user.firstName} {leave.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{leave.leaveType.name}</p>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded">
                    {leave.leaveType.code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamLeaveCalendar;
