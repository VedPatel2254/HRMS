import api from './axios';

export const getAllJobPostings = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get('/recruitment/jobs', { params });
  return data;
};

export const getJobPosting = async (id: string) => {
  const { data } = await api.get(`/recruitment/jobs/${id}`);
  return data;
};

export const createJobPosting = async (jobData: {
  title: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  department?: string;
  location?: string;
  type?: string;
  salaryMin?: number;
  salaryMax?: number;
  openings?: number;
  closingDate?: string;
}) => {
  const { data } = await api.post('/recruitment/jobs', jobData);
  return data;
};

export const updateJobPosting = async (
  id: string,
  jobData: {
    title?: string;
    description?: string;
    requirements?: string;
    responsibilities?: string;
    department?: string;
    location?: string;
    type?: string;
    salaryMin?: number;
    salaryMax?: number;
    openings?: number;
    closingDate?: string;
    status?: string;
  }
) => {
  const { data } = await api.put(`/recruitment/jobs/${id}`, jobData);
  return data;
};

export const addApplicant = async (applicantData: {
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  currentCompany?: string;
  currentDesignation?: string;
  noticePeriod?: number;
  expectedSalary?: number;
}) => {
  const { data } = await api.post('/recruitment/applicants', applicantData);
  return data;
};

export const getApplicant = async (id: string) => {
  const { data } = await api.get(`/recruitment/applicants/${id}`);
  return data;
};

export const updateApplicantStatus = async (
  id: string,
  statusData: { status: string; notes?: string }
) => {
  const { data } = await api.put(`/recruitment/applicants/${id}/status`, statusData);
  return data;
};

export const scheduleInterview = async (
  applicantId: string,
  interviewData: {
    scheduledAt: string;
    mode?: string;
    interviewerIds?: string[];
  }
) => {
  const { data } = await api.post(
    `/recruitment/applicants/${applicantId}/interview`,
    interviewData
  );
  return data;
};

export const updateInterview = async (
  id: string,
  interviewData: {
    feedback?: string;
    rating?: number;
    result?: string;
  }
) => {
  const { data } = await api.put(`/recruitment/interviews/${id}`, interviewData);
  return data;
};

export const hireApplicant = async (applicantId: string) => {
  const { data } = await api.post(`/recruitment/applicants/${applicantId}/hire`);
  return data;
};
