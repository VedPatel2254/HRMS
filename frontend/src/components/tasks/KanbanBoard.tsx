import { useState } from 'react';
import { MessageSquare, Calendar, AlertTriangle, Plus } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailDrawer from './TaskDetailDrawer';
import * as taskApi from '../../api/task.api';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string; profilePicture: string | null };
  project: { id: string; name: string } | null;
  _count: { comments: number };
}

interface KanbanBoardProps {
  tasks: Task[];
  projectId?: string;
  onRefresh?: () => void;
}

const columns = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-500' },
  { id: 'DONE', label: 'Done', color: 'bg-green-500' },
];

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  CRITICAL: 'bg-red-100 text-red-600',
};

const KanbanBoard = ({ tasks, projectId, onRefresh }: KanbanBoardProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStatus, setCreateStatus] = useState('TODO');

  const handleTaskClick = async (task: Task) => {
    try {
      const response = await taskApi.getTask(task.id);
      setSelectedTask(response.data);
    } catch {
      setSelectedTask({ ...task, comments: [] });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated');
      onRefresh?.();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      handleStatusChange(taskId, status);
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${column.color}`} />
              <h3 className="font-medium text-gray-900 dark:text-white">{column.label}</h3>
              {columnTasks.length > 0 && <span className="text-sm text-gray-500">({columnTasks.length})</span>}
              <button
                onClick={() => { setCreateStatus(column.id); setShowCreateModal(true); }}
                className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => handleTaskClick(task)}
                  className="bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{task.title}</h4>
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${priorityColors[task.priority] || ''}`}>
                      {task.priority}
                    </span>
                  </div>

                  {task.project && (
                    <span className="inline-block px-2 py-0.5 text-[10px] bg-accent/10 text-accent rounded mb-2">
                      {task.project.name}
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-[8px] font-medium text-accent">
                          {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {task._count.comments > 0 && (
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" />
                          {task._count.comments}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`flex items-center gap-0.5 ${isOverdue(task.dueDate) ? 'text-red-500' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onRefresh={onRefresh}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={projectId}
          defaultStatus={createStatus}
          onCreated={() => {
            setShowCreateModal(false);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
