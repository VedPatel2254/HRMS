import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, UserCheck, Briefcase } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import DataTable, { ColumnDef } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Avatar from '../../components/shared/Avatar';
import ConfirmModal from '../../components/shared/ConfirmModal';
import { getAllEmployees, deactivateEmployee, getEmployeeStats } from '../../api/employee.api';
import { useAuth } from '../../hooks/useAuth';
import { User } from '../../types';

const EmployeesPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isHR } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    totalActive: 0,
    totalInterns: 0,
    newThisMonth: 0,
    totalInactive: 0,
  });
  const [deactivateModal, setDeactivateModal] = useState<{ isOpen: boolean; employee: User | null }>({
    isOpen: false,
    employee: null,
  });

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllEmployees({
        page,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter,
      });
      if (response.success && response.data) {
        setEmployees(response.data.data);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await getEmployeeStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, [fetchEmployees]);

  const handleDeactivate = async () => {
    if (!deactivateModal.employee) return;
    try {
      await deactivateEmployee(deactivateModal.employee.id);
      setDeactivateModal({ isOpen: false, employee: null });
      fetchEmployees();
      fetchStats();
    } catch (error) {
      console.error('Failed to deactivate employee:', error);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Email', 'Designation', 'Role', 'Status', 'Joining Date'];
    const rows = employees.map((emp) => [
      emp.employeeId,
      `${emp.firstName} ${emp.lastName}`,
      emp.email,
      emp.designation || '-',
      emp.role,
      emp.status,
      new Date(emp.dateOfJoining).toLocaleDateString('en-IN'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<User>[] = [
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${item.firstName} ${item.lastName}`} src={item.profilePicture} size="sm" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-accent" onClick={() => navigate(`/employees/${item.id}`)}>
              {item.firstName} {item.lastName}
            </p>
            <p className="text-xs text-gray-500">{item.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'employeeId', header: 'ID', sortable: true },
    { key: 'designation', header: 'Designation', sortable: true },
    {
      key: 'role',
      header: 'Role',
      render: (item) => <StatusBadge status={item.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'dateOfJoining',
      header: 'Joining Date',
      sortable: true,
      render: (item) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(item.dateOfJoining).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/employees/${item.id}`)}
            className="text-accent hover:text-accent-600 text-sm font-medium"
          >
            View
          </button>
          {isAdmin && (
            <button
              onClick={() =>
                setDeactivateModal({ isOpen: true, employee: item })
              }
              className="text-red-500 hover:text-red-600 text-sm font-medium"
            >
              Deactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your team members"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees' }]}
        actions={
          (isAdmin || isHR) ? (
            <button
              onClick={() => navigate('/employees/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Active" value={stats.totalActive} icon={UserCheck} colorVariant="success" />
        <StatCard title="Total Interns" value={stats.totalInterns} icon={Briefcase} colorVariant="primary" />
        <StatCard title="New This Month" value={stats.newThisMonth} icon={UserPlus} colorVariant="warning" />
        <StatCard title="Inactive" value={stats.totalInactive} icon={Users} colorVariant="danger" />
      </div>

      <DataTable
        columns={columns}
        data={employees as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        pagination={{ page, limit: 10, total, onPageChange: setPage }}
        onSearch={setSearch}
        searchPlaceholder="Search by name, ID, or email..."
        filters={
          <>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="HR">HR</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="INTERN">Intern</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </>
        }
        onExport={handleExportCSV}
      />

      <ConfirmModal
        isOpen={deactivateModal.isOpen}
        onClose={() => setDeactivateModal({ isOpen: false, employee: null })}
        onConfirm={handleDeactivate}
        title="Deactivate Employee"
        description={`Are you sure you want to deactivate ${deactivateModal.employee?.firstName} ${deactivateModal.employee?.lastName}? This action can be reversed later.`}
        confirmLabel="Deactivate"
        confirmVariant="danger"
      />
    </div>
  );
};

export default EmployeesPage;
