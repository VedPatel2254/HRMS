import { useState, useEffect } from 'react';
import { Wallet, Loader2, Eye } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import PayslipView from '../../components/payroll/PayslipView';
import DownloadPayslipButton from '../../components/payroll/DownloadPayslipButton';
import * as payrollApi from '../../api/payroll.api';
import { formatINR } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

const getMonthName = (month: number): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return months[month - 1];
};

const PayrollPage = () => {
  const [payslips, setPayslips] = useState<Array<{
    id: string;
    month: number;
    year: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    paymentStatus: string;
    createdAt: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<{
    month: number;
    year: number;
  } | null>(null);
  const [payslipData, setPayslipData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingPayslip, setIsLoadingPayslip] = useState(false);

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const response = await payrollApi.getMyPayslips();
        setPayslips(response.data);
      } catch {
        toast.error('Failed to load payslips');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayslips();
  }, []);

  const handleViewPayslip = async (month: number, year: number) => {
    setSelectedPayslip({ month, year });
    setIsLoadingPayslip(true);
    try {
      const response = await payrollApi.getMyPayslipDetail(month, year);
      setPayslipData(response.data as unknown as Record<string, unknown>);
    } catch {
      toast.error('Failed to load payslip');
    } finally {
      setIsLoadingPayslip(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Payslips"
        subtitle="View and download your salary slips"
        icon={<Wallet className="w-5 h-5" />}
      />

      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Month</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Year</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Gross Salary</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Deductions</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Net Salary</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No payslips found.
                  </td>
                </tr>
              ) : (
                payslips.map((payslip) => (
                  <tr
                    key={payslip.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {getMonthName(payslip.month)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {payslip.year}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatINR(payslip.grossSalary)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatINR(payslip.totalDeductions)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatINR(payslip.netSalary)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          payslip.paymentStatus === 'PAID'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                            : payslip.paymentStatus === 'PROCESSING'
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                        }`}
                      >
                        {payslip.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPayslip(payslip.month, payslip.year)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-accent hover:bg-accent/10 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <DownloadPayslipButton month={payslip.month} year={payslip.year} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};

export default PayrollPage;
