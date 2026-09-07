import { useNavigate } from 'react-router-dom';

import { Pencil } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    client?: { name: string } | null;
    status: string;
    priority: string;
    startDate: string | null;
    endDate: string | null;
    members?: Array<{
      user: { firstName: string; lastName: string; profilePicture: string | null };
    }>;
    _count?: { tasks: number; members: number };
    taskStats?: Record<string, number>;
  };
  onEdit?: (project: ProjectCardProps['project']) => void;
}

const statusColors: Record<string, string> = {
  PLANNING: 'bg-gray-100 dark:bg-gray-800 text-gray-600',
  ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-600',
  ON_HOLD: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600',
  COMPLETED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
  CANCELLED: 'bg-red-100 dark:bg-red-900/20 text-red-600',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 dark:bg-gray-800 text-gray-600',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
  HIGH: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600',
  CRITICAL: 'bg-red-100 dark:bg-red-900/20 text-red-600',
};

const ProjectCard = ({ project, onEdit }: ProjectCardProps) => {
  const navigate = useNavigate();

  const totalTasks = project._count?.tasks || 0;
  const doneTasks = project.taskStats?.DONE || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const formatDate = (date: string | null) => {
    if (!date) return '--';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div
      className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{project.name}</h3>
          {project.client && (
            <p className="text-sm text-gray-500 mt-1">{project.client.name}</p>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${priorityColors[project.priority] || ''}`}>
            {project.priority}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[project.status] || ''}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      {project.members && project.members.length > 0 && (
        <div className="flex items-center mb-3">
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((member, idx) => (
              <div
                key={idx}
                className="w-7 h-7 rounded-full bg-accent/10 border-2 border-white dark:border-gray-900 flex items-center justify-center"
                title={`${member.user.firstName} ${member.user.lastName}`}
              >
                <span className="text-xs font-medium text-accent">
                  {member.user.firstName[0]}{member.user.lastName[0]}
                </span>
              </div>
            ))}
            {(project._count?.members || 0) > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  +{(project._count?.members || 0) - 4}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
        <div className="flex items-center gap-2">
          <span>{totalTasks} tasks</span>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(project); }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Edit project"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
