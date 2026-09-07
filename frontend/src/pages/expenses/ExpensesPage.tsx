import { useState, useEffect } from 'react';
import { Receipt, Plus, Check, X, Clock, DollarSign, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import EmptyState from '../../components/shared/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import * as expenseApi from '../../api/expense.api';
import toast from 'react-hot-toast';
import { formatINR } from '../../utils/formatCurrency';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  reviewerNote: string | null;
  createdAt: string;
}

const ExpensesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'TRAVEL',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchExpenses();
  }, [statusFilter]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      if (isAdmin) {
        const result = await expenseApi.getAllExpenses({
          status: statusFilter || undefined,
        });
        setExpenses(result.data || []);
      } else {
        const data = await expenseApi.getMyExpenses();
        setExpenses(data);
      }
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitExpense = async () => {
    if (!newExpense.title || !newExpense.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await expenseApi.createExpense({
        ...newExpense,
        amount: parseFloat(newExpense.amount),
      });
      toast.success('Expense claim submitted');
      setShowSubmitForm(false);
      setNewExpense({
        title: '',
        amount: '',
        category: 'TRAVEL',
        date: new Date().toISOString().split('T')[0],
      });
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to submit expense');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await expenseApi.approveExpense(id);
      toast.success('Expense approved');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to approve expense');
    }
  };

  const handleReject = async (id: string) => {
    const note = prompt('Reason for rejection (optional):');
    try {
      await expenseApi.rejectExpense(id, note || undefined);
      toast.success('Expense rejected');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to reject expense');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await expenseApi.markAsPaid(id);
      toast.success('Expense marked as paid');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense claim?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success('Expense deleted');
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'APPROVED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'PAID': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      TRAVEL: 'Travel',
      FOOD: 'Food & Entertainment',
      ACCOMMODATION: 'Accommodation',
      SUPPLIES: 'Office Supplies',
      SOFTWARE: 'Software/Tools',
      OTHER: 'Other',
    };
    return labels[category] || category;
  };

  const totalPending = expenses
    .filter((e) => e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = expenses
    .filter((e) => e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = expenses
    .filter((e) => e.status === 'PAID')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Expense Management' : 'My Expenses'}
        subtitle={isAdmin ? 'Review and manage expense claims' : 'Submit and track expense claims'}
        action={{
          label: 'Submit Claim',
          onClick: () => setShowSubmitForm(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-yellow-500" />
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <div className="text-2xl font-bold">{formatINR(totalPending)}</div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Check size={20} className="text-green-500" />
            <span className="text-sm text-gray-500">Approved</span>
          </div>
          <div className="text-2xl font-bold">{formatINR(totalApproved)}</div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-blue-500" />
            <span className="text-sm text-gray-500">Paid</span>
          </div>
          <div className="text-2xl font-bold">{formatINR(totalPaid)}</div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 mb-6">
          {['', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      )}

      {showSubmitForm && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Submit Expense Claim</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                value={newExpense.title}
                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="e.g. Client meeting travel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount (₹) *</label>
              <input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              >
                <option value="TRAVEL">Travel</option>
                <option value="FOOD">Food & Entertainment</option>
                <option value="ACCOMMODATION">Accommodation</option>
                <option value="SUPPLIES">Office Supplies</option>
                <option value="SOFTWARE">Software/Tools</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowSubmitForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitExpense}
              className="px-4 py-2 bg-accent text-white rounded-lg"
            >
              Submit Claim
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expense claims"
          description="Submit your first expense claim."
          icon={Receipt}
        />
      ) : (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div className="font-medium">{expense.title}</div>
                    {expense.reviewerNote && (
                      <div className="text-sm text-gray-500 mt-1">Note: {expense.reviewerNote}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold">{formatINR(expense.amount)}</td>
                  <td className="px-6 py-4 text-sm">{getCategoryLabel(expense.category)}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(expense.date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {isAdmin && expense.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(expense.id)}
                            className="text-green-500 hover:text-green-600"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(expense.id)}
                            className="text-red-500 hover:text-red-600"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {isAdmin && expense.status === 'APPROVED' && (
                        <button
                          onClick={() => handleMarkPaid(expense.id)}
                          className="text-accent hover:text-accent/80 text-sm"
                        >
                          Mark Paid
                        </button>
                      )}
                      {expense.status === 'PENDING' && (
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
