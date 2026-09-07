import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Loader2, LayoutGrid, List, Pencil, X, Check, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import KanbanBoard from '../../components/tasks/KanbanBoard';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import TaskDetailDrawer from '../../components/tasks/TaskDetailDrawer';
import { useAuth } from '../../hooks/useAuth';
import * as taskApi from '../../api/task.api';
import toast from 'react-hot-toast';

const TasksPage = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [tasks, setTasks] = useState<Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    assignedBy: string;
    assignee: { id: string; firstName: string; lastName: string; profilePicture: string | null };
    project: { id: string; name: string } | null;
    _count?: { comments: number };
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<typeof tasks[0] | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showMyTasks, setShowMyTasks] = useState(!isAdmin && !isHR);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ status: string; priority: string; dueDate: string }>({ status: '', priority: '', dueDate: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await taskApi.getAllTasks({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTasks(response.data?.data || []);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const startEdit = (task: typeof tasks[0]) => {
    setEditingTaskId(task.id);
    setEditForm({
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
  };

  const saveEdit = async (taskId: string) => {
    setIsSaving(true);
    try {
      await taskApi.updateTask(taskId, {
        status: editForm.status,
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
      });
      toast.success('Task updated');
      setEditingTaskId(null);
      fetchTasks();
    } catch {
      toast.error('Failed to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const canEditTask = (task: typeof tasks[0]) => {
    if (isAdmin) return true;
    if (isHR) return task.assignedBy === user?.id || task.assignee.id === user?.id;
    return task.assignee.id === user?.id;
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskApi.deleteTask(taskId);
      toast.success('Task deleted');
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleTaskClick = async (row: typeof tasks[0]) => {
    try {
      const response = await taskApi.getTask(row.id);
      setSelectedTask(response.data || row);
    } catch {
      setSelectedTask(row);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated');
      fetchTasks();
    } catch {
      toast.error('Failed to update task status');
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Task',
      render: (row: typeof tasks[0]) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.title}</p>
          {row.project && <p className="text-xs text-gray-500">{row.project.name}</p>}
        </div>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (row: typeof tasks[0]) => (
        <span className="text-sm text-gray-600">{row.assignee.firstName} {row.assignee.lastName}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row: typeof tasks[0]) => {
        if (editingTaskId === row.id) {
          return (
            <select
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          );
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            row.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
            row.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
            row.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {row.priority}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: typeof tasks[0]) => {
        if (editingTaskId === row.id) {
          return (
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          );
        }
        if (canEditTask(row)) {
          return (
            <select
              value={row.status}
              onChange={(e) => { e.stopPropagation(); handleStatusChange(row.id, e.target.value); }}
              className="px-2 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          );
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            row.status === 'DONE' ? 'bg-green-100 text-green-600' :
            row.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' :
            row.status === 'IN_REVIEW' ? 'bg-yellow-100 text-yellow-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {row.status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (row: typeof tasks[0]) => {
        if (editingTaskId === row.id) {
          return (
            <input
              type="date"
              value={editForm.dueDate}
              onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          );
        }
        if (!row.dueDate) return <span className="text-gray-400">--</span>;
        const isOverdue = new Date(row.dueDate) < new Date();
        return (
          <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
            {new Date(row.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row: typeof tasks[0]) => {
        if (editingTaskId === row.id) {
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); saveEdit(row.id); }}
                disabled={isSaving}
                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }
        if (!canEditTask(row)) return null;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); startEdit(row); }}
              className="p-1 text-gray-500 hover:text-accent hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Edit task"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteTask(row.id); }}
              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Manage and track your tasks"
        icon={<CheckSquare className="w-5 h-5" />}
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 ${viewMode === 'kanban' ? 'bg-accent text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-accent text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-x-auto">
          <KanbanBoard tasks={tasks} onRefresh={fetchTasks} />
        </div>
      ) : (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
          <DataTable
            columns={columns}
            data={tasks}
            onRowClick={(row) => handleTaskClick(row as typeof tasks[0])}
          />
        </div>
      )}

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          fetchTasks();
        }}
      />

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask as never}
          onClose={() => setSelectedTask(null)}
          onRefresh={fetchTasks}
        />
      )}
    </div>
  );
};

export default TasksPage;
