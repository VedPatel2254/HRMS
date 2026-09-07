import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import * as leaveApi from '../../api/leave.api';

interface LeaveType {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
}

interface LeaveBalance {
  leaveType: {
    name: string;
    code: string;
  };
  allocated: number;
  used: number;
  remaining: number;
}

interface LeaveRequestFormProps {
  onSubmit: (data: {
    leaveTypeId: string;
    fromDate: string;
    toDate: string;
    reason: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const LeaveRequestForm = ({ onSubmit, onCancel }: LeaveRequestFormProps) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, balanceRes] = await Promise.all([
          leaveApi.getLeaveTypes(),
          leaveApi.getMyLeaveBalance(),
        ]);
        setLeaveTypes(typesRes.data);
        setBalances(balanceRes.data);
      } catch {
        console.error('Failed to load leave data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateWorkingDays = (from: string, to: string): number => {
    if (!from || !to) return 0;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    let count = 0;
    const current = new Date(fromDate);

    while (current <= toDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const getBalanceForType = (typeId: string) => {
    return balances.find((b) => b.leaveType.code === typeId || b.leaveType.name === typeId);
  };

  const totalDays = calculateWorkingDays(formData.fromDate, formData.toDate);
  const selectedBalance = getBalanceForType(formData.leaveTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leaveTypeId || !formData.fromDate || !formData.toDate || !formData.reason) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        leaveTypeId: formData.leaveTypeId,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        reason: formData.reason,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Leave Type *
        </label>
        <select
          required
          value={formData.leaveTypeId}
          onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          <option value="">Select leave type</option>
          {leaveTypes.map((lt) => {
            const balance = getBalanceForType(lt.id);
            return (
              <option key={lt.id} value={lt.id}>
                {lt.name} ({lt.code}) - {balance?.remaining || 0} remaining
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From Date *
          </label>
          <input
            type="date"
            required
            value={formData.fromDate}
            onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To Date *
          </label>
          <input
            type="date"
            required
            value={formData.toDate}
            min={formData.fromDate}
            onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
      </div>

      {totalDays > 0 && (
        <div className="p-3 bg-accent/10 rounded-lg">
          <p className="text-sm text-accent font-medium">
            Total working days: {totalDays}
            {selectedBalance && totalDays > selectedBalance.remaining && (
              <span className="text-red-500 ml-2">(Insufficient balance)</span>
            )}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Reason *
        </label>
        <textarea
          required
          rows={3}
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Enter reason for leave..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (selectedBalance !== undefined && totalDays > selectedBalance.remaining)}
          className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Apply Leave
        </button>
      </div>
    </form>
  );
};

export default LeaveRequestForm;
