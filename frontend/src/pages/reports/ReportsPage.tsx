import { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Users, CheckSquare, Folder, Download, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import PageHeader from '../../components/shared/PageHeader';
import * as reportApi from '../../api/report.api';
import { exportReport, ExportFormat } from '../../utils/exportReport';
import toast from 'react-hot-toast';

const COLORS = ['#1E3A5F', '#00C2FF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

const ReportsPage = () => {
  const [headcount, setHeadcount] = useState<any>(null);
  const [taskReport, setTaskReport] = useState<any>(null);
  const [projectReport, setProjectReport] = useState<any>(null);
  const [leaveReport, setLeaveReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const formatMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formatMenuRef.current && !formatMenuRef.current.contains(e.target as Node)) {
        setShowFormatMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      setIsLoading(true);
      const [headcountData, taskData, projectData, leaveData] = await Promise.all([
        reportApi.getHeadcountReport(),
        reportApi.getTaskReport(),
        reportApi.getProjectReport(),
        reportApi.getLeaveReport(),
      ]);
      setHeadcount(headcountData);
      setTaskReport(taskData);
      setProjectReport(projectData);
      setLeaveReport(leaveData);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (data: Record<string, any>[], filename: string, title: string) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const ok = exportReport({ data, filename, title, format: exportFormat });
    if (ok) toast.success(`${filename}.${exportFormat} downloaded`);
  };

  const downloadOverview = () => {
    const rows: Record<string, any>[] = [];
    headcount?.byRole?.forEach((r: any) => rows.push({ Category: 'Role', Name: r.role, Count: r._count }));
    headcount?.byStatus?.forEach((s: any) => rows.push({ Category: 'Status', Name: s.status, Count: s._count }));
    taskReport?.byStatus?.forEach((s: any) => rows.push({ Category: 'Task Status', Name: s.status.replace(/_/g, ' '), Count: s._count }));
    projectReport?.byStatus?.forEach((s: any) => rows.push({ Category: 'Project Status', Name: s.status.replace(/_/g, ' '), Count: s._count }));
    handleExport(rows, 'overview-report', 'Overview Report');
  };

  const downloadHeadcount = () => {
    const rows: Record<string, any>[] = [];
    headcount?.byRole?.forEach((r: any) => rows.push({ Role: r.role, Count: r._count }));
    headcount?.byStatus?.forEach((s: any) => rows.push({ Status: s.status, Count: s._count }));
    headcount?.byEmploymentType?.forEach((e: any) => rows.push({ EmploymentType: e.employmentType, Count: e._count }));
    handleExport(rows, 'headcount-report', 'Headcount Report');
  };

  const downloadTasks = () => {
    const rows: Record<string, any>[] = [];
    taskReport?.byStatus?.forEach((s: any) => rows.push({ Category: 'Status', Name: s.status.replace(/_/g, ' '), Count: s._count }));
    taskReport?.byPriority?.forEach((p: any) => rows.push({ Category: 'Priority', Name: p.priority, Count: p._count }));
    taskReport?.completionRates?.forEach((r: any) => rows.push({ Category: 'Completion', EmployeeID: r.userId, Total: r.total, Completed: r.completed, Rate: `${r.completionRate}%` }));
    handleExport(rows, 'task-report', 'Task Report');
  };

  const downloadProjects = () => {
    const rows: Record<string, any>[] = [];
    projectReport?.byStatus?.forEach((s: any) => rows.push({ Category: 'Status', Name: s.status.replace(/_/g, ' '), Count: s._count }));
    projectReport?.byPriority?.forEach((p: any) => rows.push({ Category: 'Priority', Name: p.priority, Count: p._count }));
    handleExport(rows, 'project-report', 'Project Report');
  };

  const downloadLeave = () => {
    const rows: Record<string, any>[] = [];
    if (leaveReport?.byType) {
      Object.entries(leaveReport.byType).forEach(([type, days]) => rows.push({ Category: 'By Type', Name: type, Days: days as number }));
    }
    leaveReport?.topLeaveTakers?.forEach((t: any) => rows.push({ Category: 'Top Taker', Name: `${t.user.firstName} ${t.user.lastName}`, Days: t.totalDays }));
    handleExport(rows, 'leave-report', 'Leave Report');
  };

  const downloadActions: Record<string, () => void> = {
    overview: downloadOverview,
    headcount: downloadHeadcount,
    tasks: downloadTasks,
    projects: downloadProjects,
    leave: downloadLeave,
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'headcount', label: 'Headcount', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'leave', label: 'Leave', icon: TrendingUp },
  ];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="HR analytics and insights"
      />

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative" ref={formatMenuRef}>
            <button
              onClick={() => setShowFormatMenu(!showFormatMenu)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {exportFormat.toUpperCase()}
              <ChevronDown size={14} />
            </button>
            {showFormatMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[100px]">
                {(['csv', 'pdf', 'doc'] as ExportFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setExportFormat(f); setShowFormatMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      exportFormat === f
                        ? 'bg-accent text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={downloadActions[activeTab]}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>

      {activeTab === 'overview' && headcount && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Headcount by Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={headcount.byRole.map((r: any) => ({
                    name: r.role,
                    value: r._count,
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {headcount.byRole.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Employee Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={headcount.byStatus.map((s: any) => ({
                    name: s.status,
                    value: s._count,
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {headcount.byStatus.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {taskReport && (
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Tasks by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={taskReport.byStatus.map((s: any) => ({
                    name: s.status.replace(/_/g, ' '),
                    count: s._count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C2FF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {projectReport && (
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Projects by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={projectReport.byStatus.map((s: any) => ({
                      name: s.status.replace(/_/g, ' '),
                      value: s._count,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {projectReport.byStatus.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === 'headcount' && headcount && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Headcount Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-500">Total Employees</div>
                <div className="text-2xl font-bold">{headcount.total}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-500">Active</div>
                <div className="text-2xl font-bold text-green-600">{headcount.totalActive}</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={headcount.byRole.map((r: any) => ({
                  name: r.role,
                  count: r._count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1E3A5F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Employment Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={headcount.byEmploymentType.map((e: any) => ({
                  name: e.employmentType.replace(/_/g, ' '),
                  count: e._count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C2FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && taskReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Tasks by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={taskReport.byStatus.map((s: any) => ({
                  name: s.status.replace(/_/g, ' '),
                  count: s._count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={taskReport.byPriority.map((p: any) => ({
                  name: p.priority,
                  count: p._count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Task Completion by Employee</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Tasks</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {taskReport.completionRates.slice(0, 10).map((rate: any) => (
                    <tr key={rate.userId}>
                      <td className="px-4 py-3 text-sm font-mono">{rate.userId}</td>
                      <td className="px-4 py-3 text-sm">{rate.total}</td>
                      <td className="px-4 py-3 text-sm">{rate.completed}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-accent h-2 rounded-full"
                              style={{ width: `${rate.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{rate.completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && projectReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Projects by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={projectReport.byStatus.map((s: any) => ({
                    name: s.status.replace(/_/g, ' '),
                    value: s._count,
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {projectReport.byStatus.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Projects by Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={projectReport.byPriority.map((p: any) => ({
                  name: p.priority,
                  count: p._count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'leave' && leaveReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Leave Utilization by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Object.entries(leaveReport.byType).map(([type, days]) => ({
                  name: type,
                  days: days as number,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="days" fill="#00C2FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Top Leave Takers</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaveReport.topLeaveTakers.slice(0, 5).map((taker: any) => (
                    <tr key={taker.user.id}>
                      <td className="px-4 py-3 text-sm">
                        {taker.user.firstName} {taker.user.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">{taker.totalDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
