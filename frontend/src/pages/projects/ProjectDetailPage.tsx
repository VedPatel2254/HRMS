import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit, Users, CheckSquare, Calendar, IndianRupee, Plus, X, UserPlus } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import ProjectFormModal from '../../components/projects/ProjectFormModal';
import KanbanBoard from '../../components/tasks/KanbanBoard';
import { useAuth } from '../../hooks/useAuth';
import * as projectApi from '../../api/project.api';
import api from '../../api/axios';
import * as taskApi from '../../api/task.api';
import toast from 'react-hot-toast';

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  client: { id: string; name: string } | null;
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: { id: string; firstName: string; lastName: string; profilePicture: string | null; designation: string | null };
  }>;
  taskStats: Record<string, number>;
}

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isHR } = useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [tasks, setTasks] = useState<Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee: { id: string; firstName: string; lastName: string; profilePicture: string | null };
    _count: { comments: number };
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const canEdit = isAdmin || isHR;

  const fetchProject = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [projectRes, tasksRes] = await Promise.all([
        projectApi.getProject(id),
        projectApi.getProjectTasks(id),
      ]);
      setProject(projectRes.data as unknown as ProjectData);
      setTasks(tasksRes.data);
    } catch {
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleUpdate = async (data: Partial<ProjectData>) => {
    if (!id) return;
    try {
      await projectApi.updateProject(id, data);
      toast.success('Project updated');
      setShowEditModal(false);
      fetchProject();
    } catch {
      toast.error('Failed to update project');
      throw error;
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!id) return;
    try {
      await projectApi.addMember(id, userId);
      toast.success('Member added');
      setShowAddMember(false);
      fetchProject();
    } catch {
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !confirm('Remove this member?')) return;
    try {
      await projectApi.removeMember(id, userId);
      toast.success('Member removed');
      fetchProject();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees', { params: { status: 'ACTIVE', limit: 100 } });
      const empData = response.data?.data?.data || response.data?.data || [];
      setAllEmployees(empData);
    } catch {
      toast.error('Failed to load employees');
    }
  };

  const openAddMemberModal = async () => {
    setEmployeeSearch('');
    setShowAddMember(true);
    await fetchEmployees();
  };

  const filteredEmployees = allEmployees.filter((emp) => {
    const search = employeeSearch.toLowerCase();
    const isAlreadyMember = project?.members.some((m) => m.user.id === emp.id);
    return (
      !isAlreadyMember &&
      (emp.firstName.toLowerCase().includes(search) ||
        emp.lastName.toLowerCase().includes(search))
    );
  });

  const totalTasks = Object.values(project?.taskStats || {}).reduce((a, b) => a + b, 0);
  const doneTasks = project?.taskStats?.DONE || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12 text-gray-500">Project not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <PageHeader title={project.name} subtitle={project.client?.name || 'Project'} />
        {canEdit && (
          <button
            onClick={() => setShowEditModal(true)}
            className="ml-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
        )}
      </div>

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4 text-sm">
          <span className={`px-2 py-1 rounded font-medium ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
            {project.status.replace('_', ' ')}
          </span>
          <span className={`px-2 py-1 rounded font-medium ${project.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' : project.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            {project.priority}
          </span>
          <span className="text-gray-500">Progress: {progress}%</span>
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'team', label: `Team (${project.members.length})` },
          { id: 'tasks', label: `Tasks (${totalTasks})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {project.description && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Start Date:</span> <span className="text-gray-900 dark:text-white">{project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN') : '--'}</span></div>
                <div><span className="text-gray-500">End Date:</span> <span className="text-gray-900 dark:text-white">{project.endDate ? new Date(project.endDate).toLocaleDateString('en-IN') : '--'}</span></div>
                <div><span className="text-gray-500">Budget:</span> <span className="text-gray-900 dark:text-white">₹{project.budget?.toLocaleString('en-IN') || '--'}</span></div>
                <div><span className="text-gray-500">Client:</span> <span className="text-gray-900 dark:text-white">{project.client?.name || '--'}</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Task Status</h4>
              <div className="space-y-2">
                {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((status) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600">{status.replace('_', ' ')}</span>
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${totalTasks > 0 ? ((project.taskStats?.[status] || 0) / totalTasks) * 100 : 0}%` }} />
                    </div>
                    <span className="w-8 text-sm text-gray-600 text-right">{project.taskStats?.[status] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div>
            {canEdit && (
              <div className="mb-4">
                <button onClick={openAddMemberModal} className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Member
                </button>
              </div>
            )}
            <div className="space-y-3">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-accent">{member.user.firstName[0]}{member.user.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{member.user.firstName} {member.user.lastName}</p>
                      <p className="text-xs text-gray-500">{member.user.designation || member.role}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <button onClick={() => handleRemoveMember(member.user.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <KanbanBoard tasks={tasks} onRefresh={fetchProject} />
        )}
      </div>

      <ProjectFormModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} onSubmit={handleUpdate} project={project as never} />

      {showAddMember && (
        <Modal onClose={() => { setShowAddMember(false); setEmployeeSearch(''); }}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="Search by name..."
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No employees found</div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleAddMember(emp.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <UserPlus size={16} className="text-accent" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{emp.firstName} {emp.lastName}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProjectDetailPage;
