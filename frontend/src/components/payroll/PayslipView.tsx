import { formatINR, amountInWords } from '../../utils/formatCurrency';

interface PayslipData {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  travelAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
  bonus: number;
  lossOfPay: number;
  otherDeductions: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  tds: number;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  workingDays: number;
  presentDays: number;
  createdAt: string;
  user?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    designation: string;
    bankAccountNumber: string | null;
  };
}

interface PayslipViewProps {
  payslip: PayslipData;
}

const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1];
};

const PayslipView = ({ payslip }: PayslipViewProps) => {
  const maskAccount = (account: string | null) => {
    if (!account) return 'N/A';
    return '****' + account.slice(-4);
  };

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto" id="payslip-content">
      <div className="text-center mb-6 border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900">PRSECURITY CONSULTANCY & SERVICES</h1>
        <p className="text-sm text-gray-600">Surat, Gujarat, India</p>
      </div>

      <h2 className="text-lg font-semibold text-center mb-4">
        Salary Slip for {getMonthName(payslip.month)} {payslip.year}
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p><span className="font-medium">Name:</span> {payslip.user?.firstName} {payslip.user?.lastName}</p>
          <p><span className="font-medium">Employee ID:</span> {payslip.user?.employeeId}</p>
          <p><span className="font-medium">Designation:</span> {payslip.user?.designation || 'N/A'}</p>
        </div>
        <div>
          <p><span className="font-medium">Department:</span> Security Operations</p>
          <p><span className="font-medium">Bank Account:</span> {maskAccount(payslip.user?.bankAccountNumber)}</p>
          <p><span className="font-medium">Working Days:</span> {payslip.workingDays}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3 text-green-700">Earnings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Basic Salary</span>
              <span>{formatINR(payslip.basicSalary)}</span>
            </div>
            <div className="flex justify-between">
              <span>HRA</span>
              <span>{formatINR(payslip.hra)}</span>
            </div>
            <div className="flex justify-between">
              <span>Travel Allowance</span>
              <span>{formatINR(payslip.travelAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Medical Allowance</span>
              <span>{formatINR(payslip.medicalAllowance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Allowances</span>
              <span>{formatINR(payslip.otherAllowances)}</span>
            </div>
            {payslip.bonus > 0 && (
              <div className="flex justify-between">
                <span>Bonus</span>
                <span>{formatINR(payslip.bonus)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Gross Salary</span>
              <span>{formatINR(payslip.grossSalary)}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3 text-red-700">Deductions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>PF (Employee)</span>
              <span>{formatINR(payslip.pfEmployee)}</span>
            </div>
            <div className="flex justify-between">
              <span>ESI (Employee)</span>
              <span>{formatINR(payslip.esiEmployee)}</span>
            </div>
            <div className="flex justify-between">
              <span>TDS</span>
              <span>{formatINR(payslip.tds)}</span>
            </div>
            {payslip.lossOfPay > 0 && (
              <div className="flex justify-between">
                <span>Loss of Pay</span>
                <span>{formatINR(payslip.lossOfPay)}</span>
              </div>
            )}
            {payslip.otherDeductions > 0 && (
              <div className="flex justify-between">
                <span>Other Deductions</span>
                <span>{formatINR(payslip.otherDeductions)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total Deductions</span>
              <span>{formatINR(payslip.totalDeductions)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 mb-4 bg-gray-50">
        <h3 className="font-semibold text-sm mb-2">Employer Contributions</h3>
        <div className="flex gap-6 text-sm">
          <span>PF (Employer): {formatINR(payslip.pfEmployer)}</span>
          <span>ESI (Employer): {formatINR(payslip.esiEmployer)}</span>
        </div>
      </div>

      <div className="border-2 border-green-600 rounded-lg p-4 mb-4 bg-green-50">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Net Pay</p>
            <p className="text-2xl font-bold text-green-700">{formatINR(payslip.netSalary)}</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>{amountInWords(payslip.netSalary)}</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center mt-6">
        <p>Generated on {new Date(payslip.createdAt).toLocaleDateString('en-IN')}</p>
        <p>This is a computer-generated payslip.</p>
      </div>
    </div>
  );
};

export default PayslipView;
