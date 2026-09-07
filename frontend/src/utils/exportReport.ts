import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToCSV } from './exportCSV';

export type ExportFormat = 'csv' | 'pdf' | 'doc';

interface ExportOptions {
  data: Record<string, any>[];
  filename: string;
  title: string;
  format: ExportFormat;
}

function buildColumns(data: Record<string, any>[]): { header: string; key: string }[] {
  if (!data.length) return [];
  const keys = Object.keys(data[0]);
  return keys.map((k) => ({
    header: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
    key: k,
  }));
}

function buildRows(data: Record<string, any>[], columns: { key: string }[]): string[][] {
  return data.map((row) => columns.map((col) => String(row[col.key] ?? '')));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportPDF(data: Record<string, any>[], filename: string, title: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const columns = buildColumns(data);
  const rows = buildRows(data, columns);

  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 95] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14 },
  });

  doc.save(`${filename}.pdf`);
}

function exportDOC(data: Record<string, any>[], filename: string, title: string) {
  const columns = buildColumns(data);
  const rows = buildRows(data, columns);

  const tableHeaders = columns.map((c) => `<th style="background:#1E3A5F;color:#fff;padding:8px 12px;text-align:left;font-size:12px;">${c.header}</th>`).join('');

  const tableRows = rows.map((row, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f5f5f5';
    const cells = row.map((cell) => `<td style="padding:6px 12px;border-bottom:1px solid #ddd;font-size:11px;">${cell}</td>`).join('');
    return `<tr style="background:${bg}">${cells}</tr>`;
  }).join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <style>
      body { font-family: Calibri, sans-serif; margin: 20px; }
      h1 { color: #1E3A5F; font-size: 20px; margin-bottom: 4px; }
      p { color: #666; font-size: 11px; margin-top: 0; }
      table { border-collapse: collapse; width: 100%; margin-top: 16px; }
    </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Generated: ${new Date().toLocaleDateString('en-IN')}</p>
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body></html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  downloadBlob(blob, `${filename}.doc`);
}

export function exportReport({ data, filename, title, format }: ExportOptions) {
  if (!data || data.length === 0) return false;

  switch (format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'pdf':
      exportPDF(data, filename, title);
      break;
    case 'doc':
      exportDOC(data, filename, title);
      break;
    default:
      return false;
  }
  return true;
}
