import { useState, useEffect } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import Modal from '../shared/Modal';
import * as taskApi from '../../api/task.api';
import * as projectApi from '../../api/project.api';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  defaultStatus?: string;
  onCreated: () => void;
}

const CreateTaskModal = ({ isOpen, onClose, projectId, defaultStatus = 'TODO', onCreated }: CreateTaskModalProps) => {
  const { user, isHR } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; email: string; role?: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '',
    assignedTo: [] as string[],
    priority: 'MEDIUM',
    dueDate: '',
    estimatedHours: '',
    status: defaultStatus,
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/employees?limit=100').then((res) => {
        const allEmployees = res.data.data.data || [];
        if (isHR) {
          setEmployees(allEmployees.filter((emp: { role?: string }) => emp.role !== 'ADMIN'));
        } else {
          setEmployees(allEmployees);
        }
      }).catch(() => {
        setEmployees([]);
      });
      projectApi.getAllProjects({ limit: 100 }).then((res) => {
        setProjects(res.data?.data || []);
      }).catch(() => {
        setProjects([]);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, status: defaultStatus }));
  }, [defaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.assignedTo.length === 0) return;

    setIsSubmitting(true);
    try {
      await taskApi.createTask({
        title: formData.title,
        description: formData.description || undefined,
        projectId: formData.projectId || undefined,
        assignedTo: formData.assignedTo.length === 1 ? formData.assignedTo[0] : formData.assignedTo as never,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        status: formData.status,
      });
      toast.success(formData.assignedTo.length > 1 ? `Task created for ${formData.assignedTo.length} employees` : 'Task created');
      onCreated();
    } catch {
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="bg-card-light dark:bg-card-dark rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign To * {formData.assignedTo.length > 0 && <span className="text-accent">({formData.assignedTo.length} selected)</span>}
              </label>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer min-h-[38px] flex items-center"
              >
                {formData.assignedTo.length === 0 ? (
                  <span className="text-gray-400">Select employees</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {formData.assignedTo.map((id) => {
                      const emp = employees.find((e) => e.id === id);
                      return emp ? (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
                          {emp.firstName} {emp.lastName} ({emp.email})
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, assignedTo: formData.assignedTo.filter((a) => a !== id) });
                            }}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="p-1">
                    {user && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const isSelected = formData.assignedTo.includes(user.id);
                          if (isSelected) {
                            setFormData({ ...formData, assignedTo: formData.assignedTo.filter((a) => a !== user.id) });
                          } else {
                            setFormData({ ...formData, assignedTo: [...formData.assignedTo, user.id] });
                          }
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${formData.assignedTo.includes(user.id) ? 'bg-accent/10' : ''}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.assignedTo.includes(user.id) ? 'bg-accent border-accent' : 'border-gray-300 dark:border-gray-600'}`}>
                          {formData.assignedTo.includes(user.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white font-medium">Self ({user.firstName} {user.lastName})</span>
                      </div>
                    )}
                    {employees
                      .filter((emp) => {
                        if (user && emp.id === user.id) return false;
                        const name = `${emp.firstName} ${emp.lastName} ${emp.email}`.toLowerCase();
                        return name.includes(searchTerm.toLowerCase());
                      })
                      .map((emp) => {
                        const isSelected = formData.assignedTo.includes(emp.id);
                        return (
                          <div
                            key={emp.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                setFormData({ ...formData, assignedTo: formData.assignedTo.filter((a) => a !== emp.id) });
                              } else {
                                setFormData({ ...formData, assignedTo: [...formData.assignedTo, emp.id] });
                              }
                            }}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-accent/10' : ''}`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-accent border-accent' : 'border-gray-300 dark:border-gray-600'}`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">{emp.firstName} {emp.lastName} ({emp.email})</span>
                          </div>
                        );
                      })}
                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); const empIds = employees.filter((emp) => !user || emp.id !== user.id).map((emp) => emp.id); setFormData({ ...formData, assignedTo: empIds }); }}
                      className="text-xs text-accent hover:underline"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, assignedTo: [] }); }}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowDropdown(false); setSearchTerm(''); }}
                      className="ml-auto text-xs text-gray-500 hover:underline"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. Hours</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || formData.assignedTo.length === 0}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateTaskModal;
