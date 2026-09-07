import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Users, MapPin, Calendar, DollarSign, Pause, Play, XCircle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import * as recruitmentApi from '../../api/recruitment.api';
import toast from 'react-hot-toast';

interface JobPosting {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  type: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  openings: number;
  closingDate: string | null;
  _count: { applicants: number };
  createdAt: string;
}

const RecruitmentPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const result = await recruitmentApi.getAllJobPostings({
        status: statusFilter || undefined,
      });
      setJobs(result.data || []);
    } catch (error) {
      toast.error('Failed to load job postings');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-red-100 text-red-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    if (newStatus === 'CLOSED' && !window.confirm('Are you sure you want to close this job posting?')) {
      return;
    }

    try {
      await recruitmentApi.updateJobPosting(jobId, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      toast.success(`Job posting ${newStatus.toLowerCase().replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  return (
    <div>
      <PageHeader
        title="Recruitment"
        subtitle="Manage job postings and applicants"
        action={{
          label: 'New Job Posting',
          onClick: () => navigate('/recruitment/new'),
          icon: Plus,
        }}
      />

      <div className="mb-6">
        <div className="flex gap-2">
          {['', 'OPEN', 'CLOSED', 'ON_HOLD'].map((status) => (
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No job postings"
          description="Create your first job posting to start hiring."
          icon={Briefcase}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => navigate(`/recruitment/${job.id}`)}
              className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {job.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {job.department && (
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} />
                    <span>{job.department}</span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{job.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{job._count.applicants} applicants</span>
                </div>
                {job.salaryMin && job.salaryMax && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} />
                    <span>₹{(job.salaryMin / 1000).toFixed(0)}k - ₹{(job.salaryMax / 1000).toFixed(0)}k</span>
                  </div>
                )}
                {job.closingDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Closes: {new Date(job.closingDate).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-xs text-gray-500">{job.openings} opening(s)</span>
                <div className="flex items-center gap-1">
                  {job.status === 'OPEN' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(job.id, 'ON_HOLD'); }}
                        className="p-1 text-yellow-500 hover:bg-yellow-50 rounded"
                        title="Hold"
                      >
                        <Pause size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(job.id, 'CLOSED'); }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Close"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  {(job.status === 'CLOSED' || job.status === 'ON_HOLD') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(job.id, 'OPEN'); }}
                      className="p-1 text-green-500 hover:bg-green-50 rounded"
                      title="Reopen"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  <span className="text-xs text-accent font-medium ml-1">View Details →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruitmentPage;
