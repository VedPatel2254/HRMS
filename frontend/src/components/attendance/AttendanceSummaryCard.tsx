interface AttendanceSummaryCardProps {
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  attendancePercentage: number;
}

const AttendanceSummaryCard = ({
  workingDays,
  presentDays,
  absentDays,
  halfDays,
  leaveDays,
  attendancePercentage,
}: AttendanceSummaryCardProps) => {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (attendancePercentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 90) return '#22C55E';
    if (pct >= 75) return '#F59E0B';
    return '#EF4444';
  };

  const color = getColor(attendancePercentage);

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Monthly Summary
      </h3>

      <div className="flex items-center gap-6">
        <div className="relative">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {attendancePercentage}%
            </span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400">Present</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">{presentDays}</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">Absent</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{absentDays}</p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Half Day</p>
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{halfDays}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">On Leave</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{leaveDays}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Working Days</span>
          <span className="font-medium text-gray-900 dark:text-white">{workingDays}</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSummaryCard;
