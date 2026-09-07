import { useState, useEffect, useRef } from 'react';
import { Target, Award, Plus, CheckCircle, Search, X } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import EmptyState from '../../components/shared/EmptyState';
import * as performanceApi from '../../api/performance.api';
import * as employeeApi from '../../api/employee.api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  weight: number;
  status: string;
  createdAt: string;
}

interface Review {
  id: string;
  period: string;
  year: number;
  selfRating: number | null;
  managerRating: number | null;
  overallRating: number | null;
  status: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const GOAL_STATUSES = ['ACTIVE', 'COMPLETED', 'MISSED', 'DRAFT', 'SUBMITTED'] as const;

const PerformancePage = () => {
  const { user, isAdmin } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    weight: 25,
  });

  const [showAssignGoal, setShowAssignGoal] = useState(false);
  const [assignGoal, setAssignGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    weight: 25,
    userId: '',
  });
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showAssignGoal && employeeSearch.length >= 1) {
      const debounce = setTimeout(async () => {
        try {
          const response = await employeeApi.getAllEmployees({ search: employeeSearch, limit: 10 });
          setEmployees(response.data?.data || []);
          setEmployeeDropdownOpen(true);
        } catch {
          setEmployees([]);
        }
      }, 300);
      return () => clearTimeout(debounce);
    } else if (!employeeSearch) {
      setEmployees([]);
      setEmployeeDropdownOpen(false);
    }
  }, [employeeSearch, showAssignGoal]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [goalsData, reviewsData] = await Promise.all([
        performanceApi.getMyGoals(),
        performanceApi.getMyReviews(),
      ]);
      setGoals(goalsData);
      setReviews(reviewsData);
    } catch (error) {
      toast.error('Failed to load performance data');
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title) {
      toast.error('Please enter a goal title');
      return;
    }

    try {
      await performanceApi.createGoal({
        userId: user?.id || '',
        ...newGoal,
      });
      toast.success('Goal added successfully');
      setShowAddGoal(false);
      setNewGoal({ title: '', description: '', targetDate: '', weight: 25 });
      fetchData();
    } catch (error) {
      toast.error('Failed to add goal');
    }
  };

  const handleAssignGoal = async () => {
    if (!assignGoal.title) {
      toast.error('Please enter a goal title');
      return;
    }
    if (!assignGoal.userId) {
      toast.error('Please select an employee');
      return;
    }

    try {
      await performanceApi.createGoal({
        userId: assignGoal.userId,
        title: assignGoal.title,
        description: assignGoal.description || undefined,
        targetDate: assignGoal.targetDate || undefined,
        weight: assignGoal.weight,
      });
      toast.success('Goal assigned successfully');
      setShowAssignGoal(false);
      setAssignGoal({ title: '', description: '', targetDate: '', weight: 25, userId: '' });
      setSelectedEmployee(null);
      setEmployeeSearch('');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign goal');
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, newStatus: string) => {
    try {
      await performanceApi.updateGoal(goalId, { status: newStatus });
      toast.success('Goal status updated');
      fetchData();
    } catch {
      toast.error('Failed to update goal status');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await performanceApi.deleteGoal(id);
      toast.success('Goal deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'MISSED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const completedGoals = goals.filter((g) => g.status === 'COMPLETED');
  const latestReview = reviews[0];

  return (
    <div>
      <PageHeader
        title="My Performance"
        subtitle="Track goals and reviews"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAssignGoal(false); setShowAddGoal(!showAddGoal); }}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target size={20} className="text-accent" />
            <span className="text-sm text-gray-500">Active Goals</span>
          </div>
          <div className="text-3xl font-bold">{activeGoals.length}</div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-sm text-gray-500">Completed</span>
          </div>
          <div className="text-3xl font-bold">{completedGoals.length}</div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award size={20} className="text-yellow-500" />
            <span className="text-sm text-gray-500">Latest Rating</span>
          </div>
          <div className="text-3xl font-bold">
            {latestReview?.overallRating || latestReview?.selfRating || '-'}
            <span className="text-lg text-gray-400">/5</span>
          </div>
        </div>
      </div>

      {showAddGoal && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Goal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="e.g. Complete security certification"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="Describe the goal..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Date</label>
              <input
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Weight (%)</label>
              <input
                type="number"
                value={newGoal.weight}
                onChange={(e) => setNewGoal({ ...newGoal, weight: parseInt(e.target.value) })}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddGoal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAddGoal}
              className="px-4 py-2 bg-accent text-white rounded-lg"
            >
              Add Goal
            </button>
          </div>
        </div>
      )}

      {showAssignGoal && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Assign Goal to Employee</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2" ref={dropdownRef}>
              <label className="block text-sm font-medium mb-2">Employee *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.email})` : employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setSelectedEmployee(null);
                    setAssignGoal({ ...assignGoal, userId: '' });
                  }}
                  onFocus={() => { if (employees.length > 0) setEmployeeDropdownOpen(true); }}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                />
                {selectedEmployee && (
                  <button
                    onClick={() => { setSelectedEmployee(null); setEmployeeSearch(''); setAssignGoal({ ...assignGoal, userId: '' }); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {employeeDropdownOpen && employees.length > 0 && !selectedEmployee && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {employees.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setAssignGoal({ ...assignGoal, userId: emp.id });
                          setEmployeeDropdownOpen(false);
                          setEmployeeSearch('');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</span>
                        <span className="text-xs text-gray-500">{emp.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                value={assignGoal.title}
                onChange={(e) => setAssignGoal({ ...assignGoal, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="e.g. Complete security certification"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={assignGoal.description}
                onChange={(e) => setAssignGoal({ ...assignGoal, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="Describe the goal..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Date</label>
              <input
                type="date"
                value={assignGoal.targetDate}
                onChange={(e) => setAssignGoal({ ...assignGoal, targetDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Weight (%)</label>
              <input
                type="number"
                value={assignGoal.weight}
                onChange={(e) => setAssignGoal({ ...assignGoal, weight: parseInt(e.target.value) })}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => { setShowAssignGoal(false); setSelectedEmployee(null); setEmployeeSearch(''); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignGoal}
              className="px-4 py-2 bg-accent text-white rounded-lg"
            >
              Assign Goal
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">My Goals</h3>
          {goals.length === 0 ? (
            <EmptyState
              title="No goals yet"
              description="Add your first performance goal."
              icon={Target}
            />
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 5).map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{goal.title}</div>
                      {goal.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {goal.description}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Weight: {goal.weight}%</span>
                        {goal.targetDate && (
                          <span>
                            Target: {new Date(goal.targetDate).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <select
                          value={goal.status}
                          onChange={(e) => handleUpdateGoalStatus(goal.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(goal.status)}`}
                        >
                          {GOAL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                          {goal.status}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Review History</h3>
          {reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              description="Review cycles will appear here."
              icon={Award}
            />
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {review.period} {review.year}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Self: {review.selfRating || '-'} | Manager: {review.managerRating || '-'} | Overall:{' '}
                        {review.overallRating || '-'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
