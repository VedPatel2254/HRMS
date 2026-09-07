import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as payrollApi from '../../api/payroll.api';
import { formatINR } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

interface DownloadPayslipButtonProps {
  month: number;
  year: number;
  employeeId?: string;
}

const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1];
};

const DownloadPayslipButton = ({ month, year, employeeId }: DownloadPayslipButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let payslip;
      if (employeeId) {
        payslip = await payrollApi.getUserPayslip(employeeId, month, year);
      } else {
        payslip = await payrollApi.getMyPayslipDetail(month, year);
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PRSECURITY CONSULTANCY & SERVICES', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Surat, Gujarat, India', pageWidth / 2, 26, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Salary Slip for ${getMonthName(month)} ${year}`, pageWidth / 2, 38, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const data = payslip.data;
      const user = data.user;

      let y = 50;
      pdf.text(`Name: ${user?.firstName} ${user?.lastName}`, 20, y);
      pdf.text(`Employee ID: ${user?.employeeId}`, 120, y);
      y += 6;
      pdf.text(`Designation: ${user?.designation || 'N/A'}`, 20, y);
      pdf.text(`Working Days: ${data.workingDays}`, 120, y);
      y += 10;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Earnings', 20, y);
      pdf.text('Deductions', 120, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');

      const earnings = [
        ['Basic Salary', formatINR(data.basicSalary)],
        ['HRA', formatINR(data.hra)],
        ['Travel Allowance', formatINR(data.travelAllowance)],
        ['Medical Allowance', formatINR(data.medicalAllowance)],
        ['Other Allowances', formatINR(data.otherAllowances)],
      ];

      const deductions = [
        ['PF (Employee)', formatINR(data.pfEmployee)],
        ['ESI (Employee)', formatINR(data.esiEmployee)],
        ['TDS', formatINR(data.tds)],
      ];

      const maxRows = Math.max(earnings.length, deductions.length);
      for (let i = 0; i < maxRows; i++) {
        if (i < earnings.length) {
          pdf.text(earnings[i][0], 20, y);
          pdf.text(earnings[i][1], 80, y);
        }
        if (i < deductions.length) {
          pdf.text(deductions[i][0], 120, y);
          pdf.text(deductions[i][1], 170, y);
        }
        y += 5;
      }

      y += 3;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Gross Salary: ${formatINR(data.grossSalary)}`, 20, y);
      pdf.text(`Total Deductions: ${formatINR(data.totalDeductions)}`, 120, y);
      y += 8;

      pdf.setFillColor(220, 252, 231);
      pdf.rect(15, y - 4, pageWidth - 30, 12, 'F');
      pdf.text(`Net Pay: ${formatINR(data.netSalary)}`, pageWidth / 2, y + 2, { align: 'center' });

      y += 20;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('This is a computer-generated payslip.', pageWidth / 2, y, { align: 'center' });

      pdf.save(`Payslip_${user?.employeeId || 'EMP'}_${month}_${year}.pdf`);
      toast.success('Payslip downloaded');
    } catch {
      toast.error('Failed to download payslip');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-50"
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Download
    </button>
  );
};

export default DownloadPayslipButton;
