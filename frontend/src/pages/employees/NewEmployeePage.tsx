import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { createEmployee } from '../../api/employee.api';

const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

const employmentInfoSchema = z.object({
  designation: z.string().min(1, 'Designation is required'),
  role: z.enum(['HR', 'EMPLOYEE', 'INTERN'], { required_error: 'Role is required' }),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERN', 'CONTRACT']),
  dateOfJoining: z.string().min(1, 'Joining date is required'),
});

const salarySchema = z.object({
  basicSalary: z.number().min(0, 'Basic salary must be positive'),
  hra: z.number().optional(),
  travelAllowance: z.number().optional(),
  medicalAllowance: z.number().optional(),
  otherAllowances: z.number().optional(),
  pfEmployeePercent: z.number().optional(),
  pfEmployerPercent: z.number().optional(),
  esiEmployeePercent: z.number().optional(),
  esiEmployerPercent: z.number().optional(),
  tdsPercent: z.number().optional(),
});

const bankSchema = z.object({
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIFSC: z.string().optional(),
  panNumber: z.string().optional(),
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;
type EmploymentInfo = z.infer<typeof employmentInfoSchema>;
type SalaryInfo = z.infer<typeof salarySchema>;
type BankInfo = z.infer<typeof bankSchema>;

const steps = ['Personal Info', 'Employment Info', 'Salary Structure', 'Bank Details', 'Review'];

const NewEmployeePage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<{ tempPassword: string } | null>(null);

  const [personalData, setPersonalData] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [employmentData, setEmploymentData] = useState<EmploymentInfo>({
    designation: '',
    role: 'EMPLOYEE',
    employmentType: 'FULL_TIME',
    dateOfJoining: '',
  });

  const [salaryData, setSalaryData] = useState<SalaryInfo>({
    basicSalary: 30000,
    hra: 0,
    travelAllowance: 0,
    medicalAllowance: 0,
    otherAllowances: 0,
    pfEmployeePercent: 12,
    pfEmployerPercent: 12,
    esiEmployeePercent: 0.75,
    esiEmployerPercent: 3.25,
    tdsPercent: 0,
  });

  const [bankData, setBankData] = useState<BankInfo>({
    bankName: '',
    bankAccountNumber: '',
    bankIFSC: '',
    panNumber: '',
  });

  const personalForm = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalData,
  });

  const employmentForm = useForm<EmploymentInfo>({
    resolver: zodResolver(employmentInfoSchema),
    defaultValues: employmentData,
  });

  const salaryForm = useForm<SalaryInfo>({
    resolver: zodResolver(salarySchema),
    defaultValues: salaryData,
  });

  const bankForm = useForm<BankInfo>({
    resolver: zodResolver(bankSchema),
    defaultValues: bankData,
  });

  const grossSalary =
    (salaryData.basicSalary || 0) +
    (salaryData.hra || 0) +
    (salaryData.travelAllowance || 0) +
    (salaryData.medicalAllowance || 0) +
    (salaryData.otherAllowances || 0);

  const pfDeduction = (salaryData.basicSalary || 0) * ((salaryData.pfEmployeePercent || 12) / 100);
  const esiDeduction =
    grossSalary <= 21000 ? grossSalary * ((salaryData.esiEmployeePercent || 0.75) / 100) : 0;
  const tdsDeduction = grossSalary * ((salaryData.tdsPercent || 0) / 100);
  const netSalary = grossSalary - pfDeduction - esiDeduction - tdsDeduction;

  const handleNext = async () => {
    let isValid = false;

    switch (currentStep) {
      case 0:
        isValid = await personalForm.trigger();
        if (isValid) setPersonalData(personalForm.getValues());
        break;
      case 1:
        isValid = await employmentForm.trigger();
        if (isValid) setEmploymentData(employmentForm.getValues());
        break;
      case 2:
        isValid = await salaryForm.trigger();
        if (isValid) setSalaryData(salaryForm.getValues());
        break;
      case 3:
        isValid = await bankForm.trigger();
        if (isValid) setBankData(bankForm.getValues());
        break;
      case 4:
        isValid = true;
        break;
    }

    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = {
        ...personalData,
        ...employmentData,
        salaryStructure: {
          basicSalary: salaryData.basicSalary,
          hra: salaryData.hra || 0,
          travelAllowance: salaryData.travelAllowance || 0,
          medicalAllowance: salaryData.medicalAllowance || 0,
          otherAllowances: salaryData.otherAllowances || 0,
          pfEmployeePercent: salaryData.pfEmployeePercent || 12,
          pfEmployerPercent: salaryData.pfEmployerPercent || 12,
          esiEmployeePercent: salaryData.esiEmployeePercent || 0.75,
          esiEmployerPercent: salaryData.esiEmployerPercent || 3.25,
          tdsPercent: salaryData.tdsPercent || 0,
        },
        ...bankData,
      };

      const response = await createEmployee(data);
      if (response.success && response.data) {
        setCreatedEmployee({ tempPassword: response.data.tempPassword });
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdEmployee) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Employee Created Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The employee account has been created with the following temporary password:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Temporary Password</p>
            <p className="text-lg font-mono font-bold text-accent">{createdEmployee.tempPassword}</p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please share this password securely with the employee. They will be required to change it on first login.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/employees')}
              className="px-6 py-2 bg-accent hover:bg-accent-600 text-white font-medium rounded-lg transition-colors"
            >
              View All Employees
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
              <input {...personalForm.register('firstName')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              {personalForm.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{personalForm.formState.errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
              <input {...personalForm.register('lastName')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              {personalForm.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{personalForm.formState.errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input {...personalForm.register('email')} type="email" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              {personalForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{personalForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input {...personalForm.register('phone')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
              <input {...personalForm.register('dateOfBirth')} type="date" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <textarea {...personalForm.register('address')} rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact Name</label>
              <input {...personalForm.register('emergencyContactName')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact Phone</label>
              <input {...personalForm.register('emergencyContactPhone')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation *</label>
              <input {...employmentForm.register('designation')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              {employmentForm.formState.errors.designation && <p className="text-red-500 text-xs mt-1">{employmentForm.formState.errors.designation.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
              <select {...employmentForm.register('role')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employment Type</label>
              <select {...employmentForm.register('employmentType')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="INTERN">Intern</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Joining *</label>
              <input {...employmentForm.register('dateOfJoining')} type="date" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              {employmentForm.formState.errors.dateOfJoining && <p className="text-red-500 text-xs mt-1">{employmentForm.formState.errors.dateOfJoining.message}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Basic Salary (₹) *</label>
                <input {...salaryForm.register('basicSalary', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HRA (₹)</label>
                <input {...salaryForm.register('hra', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Travel Allowance (₹)</label>
                <input {...salaryForm.register('travelAllowance', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medical Allowance (₹)</label>
                <input {...salaryForm.register('medicalAllowance', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Other Allowances (₹)</label>
                <input {...salaryForm.register('otherAllowances', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Deductions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PF Employee %</label>
                  <input {...salaryForm.register('pfEmployeePercent', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ESI Employee %</label>
                  <input {...salaryForm.register('esiEmployeePercent', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TDS %</label>
                  <input {...salaryForm.register('tdsPercent', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
                </div>
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-accent mb-3">Salary Preview</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Gross Salary</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ₹{grossSalary.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Deductions</p>
                  <p className="text-lg font-bold text-red-600">
                    ₹{(pfDeduction + esiDeduction + tdsDeduction).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Net Salary</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{netSalary.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
              <input {...bankForm.register('bankName')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
              <input {...bankForm.register('bankAccountNumber')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
              <input {...bankForm.register('bankIFSC')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN Number</label>
              <input {...bankForm.register('panNumber')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white" />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Name:</span> {personalData.firstName} {personalData.lastName}</div>
                <div><span className="text-gray-500">Email:</span> {personalData.email}</div>
                <div><span className="text-gray-500">Phone:</span> {personalData.phone || '-'}</div>
                <div><span className="text-gray-500">DOB:</span> {personalData.dateOfBirth || '-'}</div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Employment Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Designation:</span> {employmentData.designation}</div>
                <div><span className="text-gray-500">Role:</span> {employmentData.role}</div>
                <div><span className="text-gray-500">Type:</span> {employmentData.employmentType}</div>
                <div><span className="text-gray-500">Joining:</span> {employmentData.dateOfJoining}</div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Salary Structure</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Basic:</span> ₹{salaryData.basicSalary?.toLocaleString('en-IN')}</div>
                <div><span className="text-gray-500">Gross:</span> ₹{grossSalary.toLocaleString('en-IN')}</div>
                <div><span className="text-gray-500">Net:</span> ₹{netSalary.toLocaleString('en-IN')}</div>
              </div>
            </div>
            {bankData.bankName && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Bank Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Bank:</span> {bankData.bankName}</div>
                  <div><span className="text-gray-500">Account:</span> {bankData.bankAccountNumber ? '****' + bankData.bankAccountNumber.slice(-4) : '-'}</div>
                  <div><span className="text-gray-500">IFSC:</span> {bankData.bankIFSC || '-'}</div>
                  <div><span className="text-gray-500">PAN:</span> {bankData.panNumber || '-'}</div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div>
      <PageHeader
        title="Add New Employee"
        subtitle="Fill in the details to create a new employee account"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: 'New Employee' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStep
                      ? 'bg-accent text-white'
                      : index === currentStep
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block" />
                )}
              </div>
            ))}
          </div>

          <div className="mb-8">{renderStepContent()}</div>

          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Employee'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEmployeePage;
