import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string; profilePicture: string | null };
  project: { id: string; name: string } | null;
}

interface TaskCalendarProps {
  tasks: Task[];
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-gray-400',
};

const statusColors: Record<string, string> = {
  DONE: 'bg-green-500',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-yellow-500',
  TODO: 'bg-gray-400',
};

const TaskCalendar = ({ tasks, month, year, onMonthChange }: TaskCalendarProps) => {
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

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate).toISOString().split('T')[0];
      return due === dateStr;
    });
  };

  const selectedTasks = selectedDate ? getTasksForDay(parseInt(selectedDate)) : [];

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
          const dayTasks = getTasksForDay(day);
          const isSelected = selectedDate === String(day);
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() + 1 === month &&
            new Date().getFullYear() === year;
          const isOverdue =
            !isToday &&
            new Date(year, month - 1, day) < new Date() &&
            dayTasks.some((t) => t.status !== 'DONE');

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : String(day))}
              className={`aspect-square rounded-lg flex flex-col items-center justify-start p-1 transition-colors ${
                isSelected
                  ? 'bg-accent text-white'
                  : isOverdue
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : isToday
                  ? 'bg-accent/10 text-accent'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  isSelected
                    ? 'text-white'
                    : isOverdue
                    ? 'text-red-600'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {day}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayTasks.slice(0, 3).map((task, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : priorityColors[task.priority] || 'bg-gray-400'
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

          {selectedTasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks due on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => {
                const isOverdue = task.status !== 'DONE' && new Date(task.dueDate!) < new Date();
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isOverdue
                        ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          statusColors[task.status] || 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.assignee.firstName} {task.assignee.lastName}
                        {task.project && ` · ${task.project.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          task.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-600'
                            : task.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-600'
                            : task.priority === 'MEDIUM'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          task.status === 'DONE'
                            ? 'bg-green-100 text-green-600'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-600'
                            : task.status === 'IN_REVIEW'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCalendar;
