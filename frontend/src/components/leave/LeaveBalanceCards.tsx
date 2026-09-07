interface LeaveBalanceCard {
  leaveType: string | { name: string; code: string };
  code: string;
  allocated: number;
  used: number;
  remaining: number;
  isPaid?: boolean;
}

interface LeaveBalanceCardsProps {
  balances: LeaveBalanceCard[];
}

const LeaveBalanceCards = ({ balances }: LeaveBalanceCardsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {balances.map((balance) => {
        const usagePercent = balance.allocated > 0
          ? Math.round((balance.used / balance.allocated) * 100)
          : 0;

        return (
          <div
            key={balance.code}
            className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">
                {typeof balance.leaveType === 'string' ? balance.leaveType : balance.leaveType.name}
              </span>
              <span className="px-2 py-0.5 text-xs font-bold bg-accent/10 text-accent rounded">
                {typeof balance.leaveType === 'string' ? balance.code : balance.leaveType.code}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {balance.remaining}
              </span>
              <span className="text-sm text-gray-400">/ {balance.allocated}</span>
            </div>

            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 80 ? 'bg-red-500' : usagePercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Used: {balance.used}</span>
              {balance.isPaid === false && (
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-400">
                  Unpaid
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaveBalanceCards;
