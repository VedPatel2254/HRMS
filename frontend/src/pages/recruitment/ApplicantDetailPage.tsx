import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, DollarSign, UserPlus } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import * as recruitmentApi from '../../api/recruitment.api';
import toast from 'react-hot-toast';

interface Interview {
  id: string;
  scheduledAt: string;
  mode: string;
  feedback: string | null;
  rating: number | null;
  result: string | null;
  interviewers: Array<{ id: string; firstName: string; lastName: string }>;
}

interface ApplicantDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  resumeUrl: string | null;
  coverLetter: string | null;
  currentCompany: string | null;
  currentDesignation: string | null;
  noticePeriod: number | null;
  expectedSalary: number | null;
  status: string;
  notes: string | null;
  jobPosting: { id: string; title: string };
  interviews: Interview[];
  createdAt: string;
}

const ApplicantDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [interviewData, setInterviewData] = useState({
    scheduledAt: '',
    mode: 'VIDEO',
  });
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    feedback: '',
    rating: 3,
    result: 'PASS',
  });

  useEffect(() => {
    if (id) fetchApplicant();
  }, [id]);

  const fetchApplicant = async () => {
    try {
      setIsLoading(true);
      const data = await recruitmentApi.getApplicant(id!);
      setApplicant(data);
    } catch (error) {
      toast.error('Failed to load applicant details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewData.scheduledAt) {
      toast.error('Please select interview date/time');
      return;
    }

    try {
      await recruitmentApi.scheduleInterview(id!, interviewData);
      toast.success('Interview scheduled');
      setShowScheduleInterview(false);
      setInterviewData({ scheduledAt: '', mode: 'VIDEO' });
      fetchApplicant();
    } catch (error) {
      toast.error('Failed to schedule interview');
    }
  };

  const handleSubmitFeedback = async (interviewId: string) => {
    try {
      await recruitmentApi.updateInterview(interviewId, feedbackData);
      toast.success('Feedback submitted');
      setShowFeedback(null);
      setFeedbackData({ feedback: '', rating: 3, result: 'PASS' });
      fetchApplicant();
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const handleHire = async () => {
    if (!confirm('Are you sure you want to hire this applicant?')) return;

    try {
      const result = await recruitmentApi.hireApplicant(id!);
      toast.success(`Applicant hired! Employee ID: ${result.employeeId}, Temp Password: ${result.tempPassword}`);
      fetchApplicant();
    } catch (error) {
      toast.error('Failed to hire applicant');
    }
  };

  const handleStatusChange = async (applicantId: string, newStatus: string) => {
    try {
      await recruitmentApi.updateApplicantStatus(applicantId, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchApplicant();
    } catch (error) {
      toast.error('Failed to update status');
    }
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

  if (!applicant) {
    return <div className="text-center py-12">Applicant not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={`${applicant.firstName} ${applicant.lastName}`}
        subtitle={applicant.jobPosting.title}
        actions={
          <button
            onClick={() => navigate(`/recruitment/${applicant.jobPosting.id}`)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Job
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Applicant Information</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(applicant.status)}`}>
                {applicant.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div>{applicant.email}</div>
                </div>
              </div>
              {applicant.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div>{applicant.phone}</div>
                  </div>
                </div>
              )}
              {applicant.currentCompany && (
                <div className="flex items-center gap-3">
                  <Briefcase size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Current Company</div>
                    <div>{applicant.currentCompany}</div>
                  </div>
                </div>
              )}
              {applicant.currentDesignation && (
                <div className="flex items-center gap-3">
                  <Briefcase size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Current Designation</div>
                    <div>{applicant.currentDesignation}</div>
                  </div>
                </div>
              )}
              {applicant.noticePeriod !== null && (
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Notice Period</div>
                    <div>{applicant.noticePeriod} days</div>
                  </div>
                </div>
              )}
              {applicant.expectedSalary !== null && (
                <div className="flex items-center gap-3">
                  <DollarSign size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Expected Salary</div>
                    <div>₹{(applicant.expectedSalary / 1000).toFixed(0)}k/year</div>
                  </div>
                </div>
              )}
            </div>

            {applicant.coverLetter && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 mb-2">Cover Letter</div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {applicant.coverLetter}
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {applicant.status !== 'HIRED' && applicant.status !== 'REJECTED' && (
                <button
                  onClick={handleHire}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Hire Applicant
                </button>
              )}
              {applicant.status !== 'HIRED' && applicant.status !== 'REJECTED' && (
                <button
                  onClick={() => setShowScheduleInterview(true)}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
                >
                  Schedule Interview
                </button>
              )}
            </div>
          </div>

          {showScheduleInterview && (
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Schedule Interview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={interviewData.scheduledAt}
                    onChange={(e) => setInterviewData({ ...interviewData, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mode</label>
                  <select
                    value={interviewData.mode}
                    onChange={(e) => setInterviewData({ ...interviewData, mode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                  >
                    <option value="VIDEO">Video Call</option>
                    <option value="PHONE">Phone</option>
                    <option value="IN_PERSON">In Person</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowScheduleInterview(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleInterview}
                  className="px-4 py-2 bg-accent text-white rounded-lg"
                >
                  Schedule
                </button>
              </div>
            </div>
          )}

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Interview History</h3>
            {applicant.interviews.length === 0 ? (
              <p className="text-gray-500">No interviews scheduled yet.</p>
            ) : (
              <div className="space-y-4">
                {applicant.interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {new Date(interview.scheduledAt).toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Mode: {interview.mode} | Interviewers:{' '}
                          {interview.interviewers
                            .map((i) => `${i.firstName} ${i.lastName}`)
                            .join(', ') || 'N/A'}
                        </div>
                        {interview.result && (
                          <div className="mt-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                interview.result === 'PASS'
                                  ? 'bg-green-100 text-green-800'
                                  : interview.result === 'FAIL'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {interview.result}
                            </span>
                            {interview.rating && (
                              <span className="ml-2 text-sm text-gray-500">
                                Rating: {interview.rating}/5
                              </span>
                            )}
                          </div>
                        )}
                        {interview.feedback && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Feedback: {interview.feedback}
                          </div>
                        )}
                      </div>
                      {!interview.result && (
                        <button
                          onClick={() => setShowFeedback(interview.id)}
                          className="text-accent text-sm hover:underline"
                        >
                          Add Feedback
                        </button>
                      )}
                    </div>

                    {showFeedback === interview.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Result</label>
                            <select
                              value={feedbackData.result}
                              onChange={(e) =>
                                setFeedbackData({ ...feedbackData, result: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                            >
                              <option value="PASS">Pass</option>
                              <option value="FAIL">Fail</option>
                              <option value="ON_HOLD">On Hold</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Rating</label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() =>
                                    setFeedbackData({ ...feedbackData, rating: star })
                                  }
                                  className={`text-2xl ${
                                    star <= feedbackData.rating
                                      ? 'text-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Feedback</label>
                            <textarea
                              value={feedbackData.feedback}
                              onChange={(e) =>
                                setFeedbackData({ ...feedbackData, feedback: e.target.value })
                              }
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                              placeholder="Enter interview feedback..."
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowFeedback(null)}
                              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitFeedback(interview.id)}
                              className="px-3 py-1 bg-accent text-white rounded-lg text-sm"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {applicant.status !== 'HIRED' && applicant.status !== 'REJECTED' && (
                <>
                  <button
                    onClick={() => handleStatusChange(applicant.id, 'SHORTLISTED')}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => handleStatusChange(applicant.id, 'REJECTED')}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>

          {applicant.notes && (
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{applicant.notes}</p>
            </div>
          )}

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-2">Application Info</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <div>Applied: {new Date(applicant.createdAt).toLocaleDateString('en-IN')}</div>
              <div>Job: {applicant.jobPosting.title}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetailPage;
