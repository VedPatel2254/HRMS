import { useState, useEffect } from 'react';
import { X, Send, Loader2, Paperclip, Upload, Trash2, CheckCircle2, Circle, ChevronDown, ChevronRight, Download } from 'lucide-react';
import Modal from '../shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import * as taskApi from '../../api/task.api';
import toast from 'react-hot-toast';
import axios from 'axios';

interface TaskPhase {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
}

interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploader?: { id: string; firstName: string; lastName: string };
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  assignee: { id: string; firstName: string; lastName: string; designation: string | null };
  assigner: { id: string; firstName: string; lastName: string };
  project: { id: string; name: string } | null;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string; profilePicture: string | null };
  }>;
  attachments?: TaskAttachment[];
  phases?: TaskPhase[];
}

interface TaskDetailDrawerProps {
  task: TaskDetail;
  onClose: () => void;
  onRefresh?: () => void;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const phaseStatusColors: Record<string, string> = {
  PENDING: 'text-gray-500',
  IN_PROGRESS: 'text-blue-500',
  COMPLETED: 'text-green-500',
};

const TaskDetailDrawer = ({ task, onClose, onRefresh }: TaskDetailDrawerProps) => {
  const { user } = useAuth();
  const [currentTask, setCurrentTask] = useState<TaskDetail>({
    ...task,
    comments: task.comments || [],
    attachments: task.attachments || [],
    phases: task.phases || [],
  });
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>(task.attachments || []);
  const [phases, setPhases] = useState<TaskPhase[]>(task.phases || []);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'phases'>('comments');
  const [newPhaseTitle, setNewPhaseTitle] = useState('');
  const [newPhaseDesc, setNewPhaseDesc] = useState('');
  const [showAddPhase, setShowAddPhase] = useState(false);

  useEffect(() => {
    fetchAttachments();
    fetchPhases();
  }, [task.id]);

  const fetchAttachments = async () => {
    try {
      const { data } = await taskApi.getAttachments(task.id);
      setAttachments(data.data || data);
    } catch {}
  };

  const fetchPhases = async () => {
    try {
      const { data } = await taskApi.getPhases(task.id);
      setPhases(data.data || data);
    } catch {}
  };

  const canEditStatus = user?.id === currentTask.assignee.id || user?.role === 'ADMIN' || user?.role === 'HR';

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await taskApi.updateTaskStatus(currentTask.id, newStatus);
      setCurrentTask((prev) => ({ ...prev, status: response.data.status }));
      toast.success('Status updated');
      onRefresh?.();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const response = await taskApi.addComment(currentTask.id, newComment);
      setCurrentTask((prev) => ({
        ...prev,
        comments: [response.data, ...prev.comments],
      }));
      setNewComment('');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    setUploading(true);
    try {
      await taskApi.uploadAttachment(task.id, formData);
      toast.success('File uploaded');
      fetchAttachments();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return;
    try {
      await taskApi.deleteAttachment(task.id, attachmentId);
      toast.success('Attachment deleted');
      fetchAttachments();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleAddPhase = async () => {
    if (!newPhaseTitle.trim()) return;
    try {
      await taskApi.createPhase(task.id, { title: newPhaseTitle, description: newPhaseDesc || undefined });
      toast.success('Phase added');
      setNewPhaseTitle('');
      setNewPhaseDesc('');
      setShowAddPhase(false);
      fetchPhases();
    } catch {
      toast.error('Failed to add phase');
    }
  };

  const handlePhaseStatus = async (phaseId: string, status: string) => {
    try {
      await taskApi.updatePhase(task.id, phaseId, { status });
      fetchPhases();
    } catch {
      toast.error('Failed to update phase');
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Delete this phase?')) return;
    try {
      await taskApi.deletePhase(task.id, phaseId);
      toast.success('Phase deleted');
      fetchPhases();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const completedPhases = phases.filter((p) => p.status === 'COMPLETED').length;

  return (
    <Modal onClose={onClose}>
      <div className="bg-card-light dark:bg-card-dark rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-card-light dark:bg-card-dark z-10">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentTask.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${priorityColors[currentTask.priority]}`}>
                {currentTask.priority}
              </span>
              {currentTask.project && (
                <span className="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded">
                  {currentTask.project.name}
                </span>
              )}
              {phases.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                  {completedPhases}/{phases.length} phases
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {canEditStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={currentTask.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdatingStatus}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          {currentTask.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{currentTask.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Assignee: </span>
              <span className="text-gray-900 dark:text-white">{currentTask.assignee.firstName} {currentTask.assignee.lastName}</span>
            </div>
            <div>
              <span className="text-gray-500">Assigned by: </span>
              <span className="text-gray-900 dark:text-white">{currentTask.assigner.firstName} {currentTask.assigner.lastName}</span>
            </div>
            <div>
              <span className="text-gray-500">Due Date: </span>
              <span className="text-gray-900 dark:text-white">
                {currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString('en-IN') : '--'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Est. Hours: </span>
              <span className="text-gray-900 dark:text-white">{currentTask.estimatedHours || '--'}</span>
            </div>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4">
            {([
              { key: 'comments', label: `Comments (${currentTask.comments.length})` },
              { key: 'attachments', label: `Files (${attachments.length})` },
              { key: 'phases', label: `Phases (${phases.length})` },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'comments' && (
            <div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {currentTask.comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-accent">
                          {comment.user.firstName[0]}{comment.user.lastName[0]}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.user.firstName} {comment.user.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">{comment.content}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <button
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50"
                >
                  {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attachments.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No attachments yet.</p>
                )}
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{att.fileName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(att.fileSize)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${att.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-accent"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <label className="mt-3 flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="text-sm text-gray-600 dark:text-gray-400">{uploading ? 'Uploading...' : 'Upload file'}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          {activeTab === 'phases' && (
            <div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {phases.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No phases defined. Break this task into steps.</p>
                )}
                {phases.sort((a, b) => a.order - b.order).map((phase) => (
                  <div key={phase.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {phase.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 cursor-pointer" onClick={() => handlePhaseStatus(phase.id, 'IN_PROGRESS')} />
                        ) : phase.status === 'IN_PROGRESS' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-blue-500 cursor-pointer" onClick={() => handlePhaseStatus(phase.id, 'COMPLETED')} />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => handlePhaseStatus(phase.id, 'IN_PROGRESS')} />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${phase.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {phase.title}
                          </p>
                          {phase.description && (
                            <p className="text-xs text-gray-500">{phase.description}</p>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDeletePhase(phase.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {showAddPhase ? (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="Phase title"
                    value={newPhaseTitle}
                    onChange={(e) => setNewPhaseTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newPhaseDesc}
                    onChange={(e) => setNewPhaseDesc(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddPhase} className="px-3 py-1.5 bg-accent text-white text-sm rounded hover:bg-accent/90">
                      Add
                    </button>
                    <button onClick={() => { setShowAddPhase(false); setNewPhaseTitle(''); setNewPhaseDesc(''); }} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm rounded">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddPhase(true)}
                  className="mt-3 text-sm text-accent hover:underline flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3" /> Add Phase
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailDrawer;
