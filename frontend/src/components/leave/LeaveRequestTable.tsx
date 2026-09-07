import StatusBadge from '../shared/StatusBadge';

interface LeaveRequest {
  id: string;
  userId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewerNote: string | null;
  createdAt: string;
  leaveType: {
    name: string;
    code: string;
  };
  user?: {
    employeeId: string;
    firstName: string;
    lastName: string;
  };
}

interface LeaveRequestTableProps {
  requests: LeaveRequest[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  showEmployee?: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const LeaveRequestTable = ({
  requests,
  onApprove,
  onReject,
  onCancel,
  showEmployee = false,
}: LeaveRequestTableProps) => {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No leave requests found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {showEmployee && (
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
            )}
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">From</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">To</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Days</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reason</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Applied</th>
            {(onApprove || onReject || onCancel) && (
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr
              key={request.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              {showEmployee && request.user && (
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {request.user.firstName} {request.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{request.user.employeeId}</p>
                  </div>
                </td>
              )}
              <td className="py-3 px-4">
                <span className="px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded">
                  {request.leaveType.code}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(request.fromDate)}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(request.toDate)}
              </td>
              <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                {request.totalDays}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                {request.reason}
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={request.status} type="leave" />
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {formatDate(request.createdAt)}
              </td>
              {(onApprove || onReject || onCancel) && (
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {request.status === 'PENDING' && onApprove && (
                      <button
                        onClick={() => onApprove(request.id)}
                        className="px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {request.status === 'PENDING' && onReject && (
                      <button
                        onClick={() => onReject(request.id)}
                        className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        Reject
                      </button>
                    )}
                    {request.status === 'PENDING' && onCancel && (
                      <button
                        onClick={() => onCancel(request.id)}
                        className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveRequestTable;
