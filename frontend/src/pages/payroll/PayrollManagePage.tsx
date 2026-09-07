import { useState, useEffect } from 'react';
import { Wallet, Loader2, Plus, Eye, Check, Trash2, Gift } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import PayslipView from '../../components/payroll/PayslipView';
import DownloadPayslipButton from '../../components/payroll/DownloadPayslipButton';
import * as payrollApi from '../../api/payroll.api';
import { formatINR } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1];
};

const PayrollManagePage = () => {
  const [payrolls, setPayrolls] = useState<Array<{
    id: string;
    month: number;
    year: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    paymentStatus: string;
    user: { employeeId: string; firstName: string; lastName: string };
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'summary'>('records');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<string | null>(null);
  const [payslipData, setPayslipData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingPayslip, setIsLoadingPayslip] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showBonusModal, setShowBonusModal] = useState<string | null>(null);
  const [bonusAmount, setBonusAmount] = useState(0);

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const response = await payrollApi.getAllPayroll({
        month: filterMonth || undefined,
        year: filterYear || undefined,
        status: filterStatus || undefined,
      });
      setPayrolls(response.data.data);
    } catch {
      toast.error('Failed to load payroll data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [filterMonth, filterYear, filterStatus]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await payrollApi.generatePayroll(generateMonth, generateYear);
      toast.success(`Generated ${result.data.generated} payslips`);
      setShowGenerateModal(false);
      fetchPayrolls();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate payroll';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewPayslip = async (userId: string, month: number, year: number) => {
    setSelectedPayslip(`${userId}-${month}-${year}`);
    setIsLoadingPayslip(true);
    try {
      const response = await payrollApi.getUserPayslip(userId, month, year);
      setPayslipData(response.data as unknown as Record<string, unknown>);
    } catch {
      toast.error('Failed to load payslip');
    } finally {
      setIsLoadingPayslip(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm('Mark this payslip as paid?')) return;
    try {
      await payrollApi.markAsPaid(id);
      toast.success('Payslip marked as paid');
      fetchPayrolls();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAddBonus = async () => {
    if (!showBonusModal || bonusAmount <= 0) return;
    try {
      await payrollApi.addBonus(showBonusModal, bonusAmount);
      toast.success('Bonus added');
      setShowBonusModal(null);
      setBonusAmount(0);
      fetchPayrolls();
    } catch {
      toast.error('Failed to add bonus');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payroll record?')) return;
    try {
      await payrollApi.deletePayroll(id);
      toast.success('Payroll deleted');
      fetchPayrolls();
    } catch {
      toast.error('Failed to delete payroll');
    }
  };

  const handleBulkMarkPaid = async () => {
    const pendingPayrolls = payrolls.filter((p) => p.paymentStatus === 'PENDING');
    if (pendingPayrolls.length === 0) {
      toast.error('No pending payrolls to mark as paid');
      return;
    }
    if (!confirm(`Mark ${pendingPayrolls.length} payslips as paid?`)) return;

    for (const payroll of pendingPayrolls) {
      try {
        await payrollApi.markAsPaid(payroll.id);
      } catch {
        console.error(`Failed to mark ${payroll.id} as paid`);
      }
    }
    toast.success('All pending payslips marked as paid');
    fetchPayrolls();
  };

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Month', 'Year', 'Gross', 'Deductions', 'Net', 'Status'];
    const rows = payrolls.map((p) => [
      p.user.employeeId,
      `${p.user.firstName} ${p.user.lastName}`,
      getMonthName(p.month),
      p.year,
      p.grossSalary,
      p.totalDeductions,
      p.netSalary,
      p.paymentStatus,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${filterMonth || 'all'}_${filterYear || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSummary = () => {
    const totalGross = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + p.totalDeductions, 0);
    const paidCount = payrolls.filter((p) => p.paymentStatus === 'PAID').length;
    const pendingCount = payrolls.filter((p) => p.paymentStatus === 'PENDING').length;

    return { totalGross, totalNet, totalDeductions, paidCount, pendingCount };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const summary = getSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        subtitle="Generate and manage employee payroll"
        icon={<Wallet className="w-5 h-5" />}
        action={
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Payroll
          </button>
        }
      />

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'records'
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            All Records
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Summary
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'records' && (
            <>
              <div className="flex flex-wrap gap-4 mb-4">
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value) : '')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                  ))}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : '')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">All Years</option>
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PAID">Paid</option>
                </select>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleBulkMarkPaid}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Mark All Paid
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Month/Year</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Gross</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Net</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          No payroll records found.
                        </td>
                      </tr>
                    ) : (
                      payrolls.map((payroll) => (
                        <tr
                          key={payroll.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {payroll.user.firstName} {payroll.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{payroll.user.employeeId}</p>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {getMonthName(payroll.month)} {payroll.year}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {formatINR(payroll.grossSalary)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                            {formatINR(payroll.netSalary)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                payroll.paymentStatus === 'PAID'
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                                  : payroll.paymentStatus === 'PROCESSING'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                              }`}
                            >
                              {payroll.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleViewPayslip(payroll.user.employeeId, payroll.month, payroll.year)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="View"
                              >
                                <Eye className="w-4 h-4 text-gray-500" />
                              </button>
                              <DownloadPayslipButton month={payroll.month} year={payroll.year} employeeId={payroll.user.employeeId} />
                              <button
                                onClick={() => { setShowBonusModal(payroll.id); setBonusAmount(0); }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                title="Add Bonus"
                              >
                                <Gift className="w-4 h-4 text-gray-500" />
                              </button>
                              {payroll.paymentStatus === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleMarkAsPaid(payroll.id)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                    title="Mark as Paid"
                                  >
                                    <Check className="w-4 h-4 text-green-500" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(payroll.id)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <p className="text-sm text-gray-500">Total Gross</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatINR(summary.totalGross)}</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <p className="text-sm text-gray-500">Total Net</p>
                  <p className="text-2xl font-bold text-green-600">{formatINR(summary.totalNet)}</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <p className="text-sm text-gray-500">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-600">{formatINR(summary.totalDeductions)}</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-bold">
                    <span className="text-green-600">{summary.paidCount} Paid</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-yellow-600">{summary.pendingCount} Pending</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showGenerateModal && (
        <Modal onClose={() => setShowGenerateModal(false)}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generate Payroll
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Month *
                </label>
                <select
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year *
                </label>
                <select
                  value={generateYear}
                  onChange={(e) => setGenerateYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Generate
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {selectedPayslip && (
        <Modal onClose={() => { setSelectedPayslip(null); setPayslipData(null); }}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            {isLoadingPayslip ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : payslipData ? (
              <PayslipView payslip={payslipData as never} />
            ) : null}
          </div>
        </Modal>
      )}

      {showBonusModal && (
        <Modal onClose={() => { setShowBonusModal(null); setBonusAmount(0); }}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Bonus</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bonus Amount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={bonusAmount}
                onChange={(e) => setBonusAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowBonusModal(null); setBonusAmount(0); }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBonus}
                disabled={bonusAmount <= 0}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                Add Bonus
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PayrollManagePage;
