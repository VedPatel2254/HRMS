import { useState, useEffect } from 'react';
import { FolderKanban, Plus, Loader2, LayoutGrid, List, Search } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import ProjectCard from '../../components/projects/ProjectCard';
import ProjectFormModal from '../../components/projects/ProjectFormModal';
import { useAuth } from '../../hooks/useAuth';
import * as projectApi from '../../api/project.api';
import toast from 'react-hot-toast';

const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;

const ProjectsPage = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [projects, setProjects] = useState<Array<{
    id: string;
    name: string;
    client: { name: string } | null;
    status: string;
    priority: string;
    createdBy: string;
    startDate: string | null;
    endDate: string | null;
    members: Array<{ user: { firstName: string; lastName: string; profilePicture: string | null } }>;
    _count: { tasks: number; members: number };
    taskStats: Record<string, number>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const canEditProject = (project: typeof projects[0]) => {
    return isAdmin || project.createdBy === user?.id;
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      await projectApi.updateProject(projectId, { status: newStatus } as any);
      toast.success('Project status updated');
      fetchProjects();
    } catch {
      toast.error('Failed to update project status');
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectApi.getAllProjects({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setProjects(response.data.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchProjects, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, statusFilter, priorityFilter]);

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    priority?: string;
    memberIds?: string[];
  }) => {
    try {
      await projectApi.createProject(data);
      toast.success('Project created');
      setShowFormModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch {
      toast.error('Failed to create project');
    }
  };

  const handleUpdateProject = async (data: {
    name: string;
    description?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    priority?: string;
    memberIds?: string[];
  }) => {
    try {
      await projectApi.updateProject(selectedProject.id, data);
      toast.success('Project updated');
      setShowFormModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch {
      toast.error('Failed to update project');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (row: typeof projects[0]) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
          {row.client && <p className="text-xs text-gray-500">{row.client.name}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: typeof projects[0]) => (
        canEditProject(row) ? (
          <select
            value={row.status}
            onChange={(e) => { e.stopPropagation(); handleUpdateProjectStatus(row.id, e.target.value); }}
            className="px-2 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        ) : (
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            row.status === 'ACTIVE' ? 'bg-green-100 text-green-600' :
            row.status === 'PLANNING' ? 'bg-gray-100 text-gray-600' :
            row.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-600' :
            row.status === 'COMPLETED' ? 'bg-blue-100 text-blue-600' :
            'bg-red-100 text-red-600'
          }`}>
            {row.status.replace('_', ' ')}
          </span>
        )
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row: typeof projects[0]) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          row.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
          row.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
          row.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {row.priority}
        </span>
      ),
    },
    {
      key: 'members',
      header: 'Team',
      render: (row: typeof projects[0]) => (
        <span className="text-sm text-gray-600">{row._count.members} members</span>
      ),
    },
    {
      key: '_count',
      header: 'Tasks',
      render: (row: typeof projects[0]) => {
        const total = row._count.tasks;
        const done = row.taskStats?.DONE || 0;
        return <span className="text-sm text-gray-600">{done}/{total}</span>;
      },
    },
    {
      key: 'startDate',
      header: 'Timeline',
      render: (row: typeof projects[0]) => {
        const start = row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '--';
        const end = row.endDate ? new Date(row.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '--';
        return <span className="text-sm text-gray-600">{start} → {end}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Manage your project portfolio"
        icon={<FolderKanban className="w-5 h-5" />}
        action={
          (isAdmin || isHR) && (
            <button
              onClick={() => { setSelectedProject(null); setShowFormModal(true); }}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="PLANNING">Planning</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
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
        <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 ${viewMode === 'card' ? 'bg-accent text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 ${viewMode === 'table' ? 'bg-accent text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No projects found.
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={canEditProject(project) ? (p) => { setSelectedProject(p); setShowFormModal(true); } : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
          <DataTable columns={columns} data={projects} />
        </div>
      )}

      <ProjectFormModal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setSelectedProject(null); }}
        onSubmit={selectedProject ? handleUpdateProject : handleCreateProject}
        project={selectedProject}
      />
    </div>
  );
};

export default ProjectsPage;
