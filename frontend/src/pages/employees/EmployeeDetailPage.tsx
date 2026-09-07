import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  Calendar,
  Briefcase,
  FileText,
  Wallet,
  Loader2,
  Upload,
  Download,
  Trash2,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import Avatar from '../../components/shared/Avatar';
import EmptyState from '../../components/shared/EmptyState';
import FileUpload from '../../components/shared/FileUpload';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import { getEmployee, updateEmployee, uploadDocument, getDocuments, deleteDocument, deactivateEmployee } from '../../api/employee.api';
import { useAuth } from '../../hooks/useAuth';
import { User } from '../../types';
import EditEmployeeModal from './EditEmployeeModal';
import * as attendanceApi from '../../api/attendance.api';
import * as leaveApi from '../../api/leave.api';
import * as payrollApi from '../../api/payroll.api';
import * as taskApi from '../../api/task.api';

interface Document {
  fileName: string;
  originalName: string;
  path: string;
  size: number;
  uploadedAt: string;
}

const EmployeeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isHR } = useAuth();
  const [employee, setEmployee] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSalaryEdit, setShowSalaryEdit] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<Array<{
    date: string;
    status: string;
    punchIn: string | null;
    punchOut: string | null;
    workingHours: number | null;
    isHoliday: boolean;
    holidayName?: string;
  }>>([]);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const canEdit = isAdmin || isHR;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [empRes, docRes] = await Promise.all([
          getEmployee(id),
          getDocuments(id),
        ]);
        if (empRes.success && empRes.data) setEmployee(empRes.data as unknown as User);
        if (docRes.success && docRes.data) setDocuments(docRes.data as unknown as Document[]);
      } catch (error) {
        console.error('Failed to fetch employee:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'attendance' && id) {
      const fetchAttendance = async () => {
        try {
          const response = await attendanceApi.getUserAttendance(id, attendanceMonth, attendanceYear);
          if (response.success) {
            setAttendanceRecords(response.data);
          }
        } catch (error) {
          console.error('Failed to fetch attendance:', error);
        }
      };
      fetchAttendance();
    }
  }, [activeTab, id, attendanceMonth, attendanceYear]);

  useEffect(() => {
    if (activeTab === 'leave' && id) {
      const fetchLeave = async () => {
        try {
          const [balRes, reqRes] = await Promise.all([
            leaveApi.getUserLeaveBalance(id),
            leaveApi.getAllLeaveRequests({ userId: id }),
          ]);
          if (balRes.success && balRes.data) setLeaveBalances(balRes.data as any);
          if (reqRes.success && reqRes.data) setLeaveRequests((reqRes.data as any).data || []);
        } catch (error) {
          console.error('Failed to fetch leave:', error);
        }
      };
      fetchLeave();
    }
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab === 'payslips' && id) {
      const fetchPayslips = async () => {
        try {
          const res = await payrollApi.getUserPayslip(id, new Date().getMonth() + 1, new Date().getFullYear());
          if (res.success && res.data) setPayslips([res.data]);
        } catch {
          setPayslips([]);
        }
      };
      fetchPayslips();
    }
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab === 'tasks' && id) {
      const fetchTasks = async () => {
        try {
          const res = await taskApi.getAllTasks({ assignedTo: id });
          if (res.success && res.data) setTasks((res.data as any).data || []);
        } catch {
          setTasks([]);
        }
      };
      fetchTasks();
    }
  }, [activeTab, id]);

  const handleUploadDocument = async (file: File) => {
    if (!id) return;
    try {
      const response = await uploadDocument(id, file);
      if (response.success) {
        const docRes = await getDocuments(id);
        if (docRes.success && docRes.data) setDocuments(docRes.data as unknown as Document[]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDeleteDocument = async (fileName: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const response = await deleteDocument(id, fileName);
      if (response.success) {
        setDocuments((prev) => prev.filter((doc) => doc.fileName !== fileName));
        toast.success('Document deleted');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to deactivate this employee?')) return;
    try {
      const response = await deactivateEmployee(id);
      if (response.success) {
        toast.success('Employee deactivated');
        navigate('/employees');
      }
    } catch (error) {
      console.error('Deactivate failed:', error);
      toast.error('Failed to deactivate employee');
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      await updateEmployee(id, { profilePicture: file.name });
      const empRes = await getEmployee(id);
      if (empRes.success && empRes.data) setEmployee(empRes.data as unknown as User);
    } catch (error) {
      console.error('Failed to update profile picture:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'salary', label: 'Salary' },
    { id: 'documents', label: 'Documents' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'payslips', label: 'Payslips' },
    { id: 'tasks', label: 'Tasks' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!employee) {
    return (
      <EmptyState
        title="Employee not found"
        description="The employee you're looking for doesn't exist."
        action={{ label: 'Back to Employees', onClick: () => navigate('/employees') }}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        subtitle={employee.employeeId}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: `${employee.firstName} ${employee.lastName}` },
        ]}
        actions={
          canEdit ? (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-accent hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <Avatar
                  name={`${employee.firstName} ${employee.lastName}`}
                  src={employee.profilePicture}
                  size="lg"
                />
                {canEdit && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:bg-accent-600 transition-colors">
                    <Upload className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-sm text-gray-500">{employee.employeeId}</p>
              <div className="mt-2">
                <StatusBadge status={employee.status} />
              </div>
              {employee.designation && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {employee.designation}
                </p>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{employee.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{employee.role}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Joined {new Date(employee.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {canEdit && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleDeactivate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <UserX className="w-4 h-4" />
                  Deactivate Employee
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-accent text-accent'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.dateOfBirth
                            ? new Date(employee.dateOfBirth).toLocaleDateString('en-IN')
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Employment Type</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.employmentType?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.address || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Contact Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.emergencyContactName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.emergencyContactPhone || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Bank Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Bank Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.bankName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Number</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {employee.bankAccountNumber
                            ? '****' + employee.bankAccountNumber.slice(-4)
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">IFSC Code</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {employee.bankIFSC || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">PAN Number</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {employee.panNumber || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'salary' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Salary Structure
                    </h3>
                    {canEdit && (
                      <button
                        onClick={() => { setShowSalaryEdit(true); setShowEditModal(true); }}
                        className="px-4 py-2 bg-accent hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Edit Salary
                      </button>
                    )}
                  </div>

                  {employee.salaryStructure ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Earnings</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-3 text-gray-500">Basic Salary</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  ₹{employee.salaryStructure.basicSalary.toLocaleString('en-IN')}
                                </td>
                              </tr>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-3 text-gray-500">HRA</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  ₹{employee.salaryStructure.hra.toLocaleString('en-IN')}
                                </td>
                              </tr>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-3 text-gray-500">Travel Allowance</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  ₹{employee.salaryStructure.travelAllowance.toLocaleString('en-IN')}
                                </td>
                              </tr>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-3 text-gray-500">Medical Allowance</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  ₹{employee.salaryStructure.medicalAllowance.toLocaleString('en-IN')}
                                </td>
                              </tr>
                              <tr>
                                <td className="px-4 py-3 text-gray-500">Other Allowances</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  ₹{employee.salaryStructure.otherAllowances.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Deductions</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-3 text-gray-500">PF (Employee)</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  {employee.salaryStructure.pfEmployeePercent}%
                                </td>
                              </tr>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-3 text-gray-500">ESI (Employee)</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  {employee.salaryStructure.esiEmployeePercent}%
                                </td>
                              </tr>
                              <tr>
                                <td className="px-4 py-3 text-gray-500">TDS</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  {employee.salaryStructure.tdsPercent}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="No salary structure"
                      description="Salary structure has not been set up for this employee."
                      icon={Wallet}
                    />
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Documents
                    </h3>
                  </div>

                  <div className="mb-6">
                    <FileUpload
                      onFileSelect={handleUploadDocument}
                      label="Upload new document"
                    />
                  </div>

                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.fileName}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-accent" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {doc.originalName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(doc.size / 1024).toFixed(1)} KB •{' '}
                                {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-2 text-gray-400 hover:text-accent transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteDocument(doc.fileName)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No documents"
                      description="No documents have been uploaded yet."
                      icon={FileText}
                    />
                  )}
                </div>
              )}

              {activeTab === 'attendance' && (
                <AttendanceCalendar
                  records={attendanceRecords}
                  month={attendanceMonth}
                  year={attendanceYear}
                  onMonthChange={(month, year) => {
                    setAttendanceMonth(month);
                    setAttendanceYear(year);
                  }}
                />
              )}

              {activeTab === 'leave' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leave Balance</h3>
                  {leaveBalances.length === 0 ? (
                    <EmptyState title="No leave data" description="No leave balance found." icon={Briefcase} />
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {leaveBalances.map((b: any) => (
                        <div key={b.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-xs text-gray-500">{b.leaveType?.name}</div>
                          <div className="text-lg font-bold">{b.remaining}<span className="text-xs text-gray-400">/{b.allocated}</span></div>
                          <div className="text-xs text-gray-400">Used: {b.used}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6">Leave History</h3>
                  {leaveRequests.length === 0 ? (
                    <EmptyState title="No leave requests" description="No leave history found." icon={Briefcase} />
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2">Type</th>
                          <th className="text-left py-2">From</th>
                          <th className="text-left py-2">To</th>
                          <th className="text-left py-2">Days</th>
                          <th className="text-left py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveRequests.map((lr: any) => (
                          <tr key={lr.id} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-2">{lr.leaveType?.name}</td>
                            <td className="py-2">{new Date(lr.fromDate).toLocaleDateString('en-IN')}</td>
                            <td className="py-2">{new Date(lr.toDate).toLocaleDateString('en-IN')}</td>
                            <td className="py-2">{lr.totalDays}</td>
                            <td className="py-2"><StatusBadge status={lr.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'payslips' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payslips</h3>
                  {payslips.length === 0 ? (
                    <EmptyState title="No payslips" description="No payslip data found." icon={Wallet} />
                  ) : (
                    <div className="space-y-3">
                      {payslips.map((p: any) => (
                        <div key={p.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{new Date(p.year, p.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                Gross: ₹{p.grossSalary?.toLocaleString('en-IN')} | Net: ₹{p.netSalary?.toLocaleString('en-IN')}
                              </div>
                            </div>
                            <StatusBadge status={p.paymentStatus} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assigned Tasks</h3>
                  {tasks.length === 0 ? (
                    <EmptyState title="No tasks" description="No tasks assigned." icon={Briefcase} />
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((t: any) => (
                        <div key={t.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{t.title}</div>
                            <div className="text-xs text-gray-500">{t.project?.name || 'No project'} {t.dueDate ? `| Due: ${new Date(t.dueDate).toLocaleDateString('en-IN')}` : ''}</div>
                          </div>
                          <StatusBadge status={t.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setShowSalaryEdit(false); }}
        employee={employee}
        isSalaryEdit={showSalaryEdit}
        onSuccess={() => {
          setShowEditModal(false);
          setShowSalaryEdit(false);
          if (id) {
            getEmployee(id).then((res) => {
              if (res.success && res.data) setEmployee(res.data as unknown as User);
            });
          }
        }}
      />
    </div>
  );
};

export default EmployeeDetailPage;
