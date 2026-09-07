import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateEmployee } from '../../api/employee.api';
import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: User;
  isSalaryEdit: boolean;
  onSuccess: () => void;
}

const EditEmployeeModal = ({ isOpen, onClose, employee, isSalaryEdit, onSuccess }: EditEmployeeModalProps) => {
  const { isAdmin, isHR } = useAuth();
  const canEditSalary = isAdmin || isHR;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (employee) {
      setFormData({
        phone: employee.phone || '',
        address: employee.address || '',
        emergencyContactName: employee.emergencyContactName || '',
        emergencyContactPhone: employee.emergencyContactPhone || '',
        bankName: employee.bankName || '',
        bankAccountNumber: employee.bankAccountNumber || '',
        bankIFSC: employee.bankIFSC || '',
        panNumber: employee.panNumber || '',
        basicSalary: employee.salaryStructure?.basicSalary || 0,
        hra: employee.salaryStructure?.hra || 0,
        travelAllowance: employee.salaryStructure?.travelAllowance || 0,
        medicalAllowance: employee.salaryStructure?.medicalAllowance || 0,
        otherAllowances: employee.salaryStructure?.otherAllowances || 0,
        pfEmployeePercent: employee.salaryStructure?.pfEmployeePercent || 12,
        esiEmployeePercent: employee.salaryStructure?.esiEmployeePercent || 0.75,
        tdsPercent: employee.salaryStructure?.tdsPercent || 0,
      });
    }
  }, [employee]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const data: Record<string, unknown> = {};
      if (isSalaryEdit && canEditSalary) {
        data.salaryStructure = {
          basicSalary: formData.basicSalary,
          hra: formData.hra,
          travelAllowance: formData.travelAllowance,
          medicalAllowance: formData.medicalAllowance,
          otherAllowances: formData.otherAllowances,
          pfEmployeePercent: formData.pfEmployeePercent,
          esiEmployeePercent: formData.esiEmployeePercent,
          tdsPercent: formData.tdsPercent,
        };
      } else {
        data.phone = formData.phone;
        data.address = formData.address;
        data.emergencyContactName = formData.emergencyContactName;
        data.emergencyContactPhone = formData.emergencyContactPhone;
        data.bankName = formData.bankName;
        data.bankAccountNumber = formData.bankAccountNumber;
        data.bankIFSC = formData.bankIFSC;
        data.panNumber = formData.panNumber;
      }
      const response = await updateEmployee(employee.id, data);
      if (response.success) onSuccess();
      else setError(response.message || 'Failed to update.');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isSalaryEdit ? 'Edit Salary Structure' : 'Edit Profile'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
          {isSalaryEdit && canEditSalary ? (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Earnings</h4>
              <div className="grid grid-cols-2 gap-4">
                {(['basicSalary', 'hra', 'travelAllowance', 'medicalAllowance', 'otherAllowances'] as const).map((field) => (
                  <div key={field}>
                    <label className={labelClass}>{field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} (₹)</label>
                    <input name={field} type="number" value={formData[field]} onChange={handleChange} className={inputClass} />
                  </div>
                ))}
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white pt-4">Deductions</h4>
              <div className="grid grid-cols-3 gap-4">
                {(['pfEmployeePercent', 'esiEmployeePercent', 'tdsPercent'] as const).map((field) => (
                  <div key={field}>
                    <label className={labelClass}>{field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} (%)</label>
                    <input name={field} type="number" step="0.01" value={formData[field]} onChange={handleChange} className={inputClass} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['phone', 'bankName', 'bankAccountNumber', 'bankIFSC', 'panNumber'] as const).map((field) => (
                  <div key={field}>
                    <label className={labelClass}>{field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
                    <input name={field} value={formData[field] as string} onChange={handleChange} className={inputClass} />
                  </div>
                ))}
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <textarea name="address" value={formData.address as string} onChange={handleChange} rows={2} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Emergency Contact Name</label>
                  <input name="emergencyContactName" value={formData.emergencyContactName as string} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Emergency Contact Phone</label>
                  <input name="emergencyContactPhone" value={formData.emergencyContactPhone as string} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-accent hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
