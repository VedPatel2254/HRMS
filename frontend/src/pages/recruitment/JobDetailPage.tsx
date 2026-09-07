import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, Mail, Phone, Briefcase, Calendar, DollarSign } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import * as recruitmentApi from '../../api/recruitment.api';
import toast from 'react-hot-toast';

interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentCompany: string | null;
  currentDesignation: string | null;
  expectedSalary: number | null;
  status: string;
  createdAt: string;
}

interface JobDetail {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  department: string | null;
  location: string | null;
  type: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  openings: number;
  closingDate: string | null;
  applicants: Applicant[];
  createdAt: string;
}

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddApplicant, setShowAddApplicant] = useState(false);
  const [newApplicant, setNewApplicant] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentCompany: '',
    currentDesignation: '',
    expectedSalary: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newApplicant.firstName || newApplicant.firstName.trim().length < 2) {
      errors.firstName = 'First name is required (min 2 characters)';
    }
    if (!newApplicant.lastName || newApplicant.lastName.trim().length < 2) {
      errors.lastName = 'Last name is required (min 2 characters)';
    }
    if (!newApplicant.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newApplicant.email)) {
      errors.email = 'Valid email is required';
    }
    if (!newApplicant.phone || newApplicant.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Phone is required (min 10 digits)';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = (() => {
    return (
      newApplicant.firstName.trim().length >= 2 &&
      newApplicant.lastName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newApplicant.email) &&
      newApplicant.phone.replace(/\D/g, '').length >= 10
    );
  })();

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setIsLoading(true);
      const data = await recruitmentApi.getJobPosting(id!);
      setJob(data);
    } catch (error) {
      toast.error('Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddApplicant = async () => {
    if (!validateForm()) return;

    try {
      await recruitmentApi.addApplicant({
        jobPostingId: id!,
        ...newApplicant,
        expectedSalary: newApplicant.expectedSalary
          ? parseInt(newApplicant.expectedSalary)
          : undefined,
      });
      toast.success('Applicant added successfully');
      setShowAddApplicant(false);
      setNewApplicant({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        currentCompany: '',
        currentDesignation: '',
        expectedSalary: '',
      });
      setFormErrors({});
      fetchJob();
    } catch (error) {
      toast.error('Failed to add applicant');
    }
  };

  const handleStatusChange = async (applicantId: string, newStatus: string) => {
    try {
      await recruitmentApi.updateApplicantStatus(applicantId, { status: newStatus });
      toast.success('Status updated');
      fetchJob();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleHire = async (applicantId: string) => {
    if (!confirm('Are you sure you want to hire this applicant? This will create an employee account.')) {
      return;
    }

    try {
      const result = await recruitmentApi.hireApplicant(applicantId);
      toast.success(`Applicant hired! Employee ID: ${result.employeeId}, Temp Password: ${result.tempPassword}`);
      fetchJob();
    } catch (error) {
      toast.error('Failed to hire applicant');
    }
  };

  const pipelineStages = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'HIRED', 'REJECTED'];

  const getApplicantsByStage = (stage: string) => {
    return job?.applicants.filter((a) => a.status === stage) || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED': return 'bg-blue-100 text-blue-800';
      case 'SHORTLISTED': return 'bg-purple-100 text-purple-800';
      case 'INTERVIEW_SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      case 'OFFERED': return 'bg-green-100 text-green-800';
      case 'HIRED': return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return <div className="text-center py-12">Job not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={job.title}
        subtitle={`${job.department || 'N/A'} • ${job.location || 'N/A'}`}
        action={{
          label: 'Back to Recruitment',
          onClick: () => navigate('/recruitment'),
          icon: ArrowLeft,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 mb-1">Status</div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
            {job.status}
          </span>
        </div>
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 mb-1">Openings</div>
          <div className="text-lg font-semibold">{job.openings}</div>
        </div>
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 mb-1">Applicants</div>
          <div className="text-lg font-semibold">{job.applicants.length}</div>
        </div>
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 mb-1">Salary Range</div>
          <div className="text-lg font-semibold">
            {job.salaryMin && job.salaryMax
              ? `₹${(job.salaryMin / 1000).toFixed(0)}k - ₹${(job.salaryMax / 1000).toFixed(0)}k`
              : 'Not specified'}
          </div>
        </div>
      </div>

      {job.description && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Description</h3>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Applicant Pipeline</h3>
          <button
            onClick={() => setShowAddApplicant(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 flex items-center gap-2"
          >
            <UserPlus size={16} />
            Add Applicant
          </button>
        </div>

        {showAddApplicant && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-3">Add New Applicant</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  placeholder="First Name *"
                  value={newApplicant.firstName}
                  onChange={(e) => { setNewApplicant({ ...newApplicant, firstName: e.target.value }); setFormErrors((prev) => ({ ...prev, firstName: '' })); }}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 ${formErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {formErrors.firstName && <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>}
              </div>
              <div>
                <input
                  placeholder="Last Name *"
                  value={newApplicant.lastName}
                  onChange={(e) => { setNewApplicant({ ...newApplicant, lastName: e.target.value }); setFormErrors((prev) => ({ ...prev, lastName: '' })); }}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 ${formErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {formErrors.lastName && <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>}
              </div>
              <div>
                <input
                  placeholder="Email *"
                  type="email"
                  value={newApplicant.email}
                  onChange={(e) => { setNewApplicant({ ...newApplicant, email: e.target.value }); setFormErrors((prev) => ({ ...prev, email: '' })); }}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <input
                  placeholder="Phone *"
                  value={newApplicant.phone}
                  onChange={(e) => { setNewApplicant({ ...newApplicant, phone: e.target.value }); setFormErrors((prev) => ({ ...prev, phone: '' })); }}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 ${formErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>
              <input
                placeholder="Current Company"
                value={newApplicant.currentCompany}
                onChange={(e) => setNewApplicant({ ...newApplicant, currentCompany: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
              <input
                placeholder="Current Designation"
                value={newApplicant.currentDesignation}
                onChange={(e) => setNewApplicant({ ...newApplicant, currentDesignation: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
              <input
                placeholder="Expected Salary (₹)"
                type="number"
                value={newApplicant.expectedSalary}
                onChange={(e) => setNewApplicant({ ...newApplicant, expectedSalary: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowAddApplicant(false); setFormErrors({}); }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddApplicant}
                disabled={!isFormValid}
                className="px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Applicant
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-6 gap-4 overflow-x-auto">
          {pipelineStages.map((stage) => (
            <div key={stage} className="min-w-[180px]">
              <div className="text-xs font-medium text-gray-500 mb-2 text-center">
                {stage.replace(/_/g, ' ')}
              </div>
              <div className="space-y-2">
                {getApplicantsByStage(stage).map((applicant) => (
                  <div
                    key={applicant.id}
                    onClick={() => navigate(`/recruitment/applicants/${applicant.id}`)}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 cursor-pointer hover:border-accent border border-transparent transition-colors"
                  >
                    <div className="font-medium text-sm">
                      {applicant.firstName} {applicant.lastName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{applicant.email}</div>
                    {applicant.expectedSalary && (
                      <div className="text-xs text-accent mt-1">
                        ₹{(applicant.expectedSalary / 1000).toFixed(0)}k
                      </div>
                    )}
                    <div className="flex gap-1 mt-2">
                      {stage !== 'HIRED' && stage !== 'REJECTED' && (
                        <>
                          <select
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(applicant.id, e.target.value);
                            }}
                            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                          >
                            <option value="">Move to...</option>
                            {pipelineStages
                              .filter((s) => s !== stage && s !== 'REJECTED')
                              .map((s) => (
                                <option key={s} value={s}>
                                  {s.replace(/_/g, ' ')}
                                </option>
                              ))}
                          </select>
                          {stage !== 'HIRED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHire(applicant.id);
                              }}
                              className="text-xs px-2 py-1 bg-green-500 text-white rounded"
                            >
                              Hire
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {getApplicantsByStage(stage).length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">No applicants</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
