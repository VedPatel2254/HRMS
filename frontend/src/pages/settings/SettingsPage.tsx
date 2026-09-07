import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Calendar, DollarSign, Users, Shield, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import * as settingsApi from '../../api/settings.api';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    companyName: 'PRSECURITY CONSULTANCY & SERVICES',
    address: '',
    gstin: '',
    phone: '',
    email: '',
    financialYearStart: 4,
  });

  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'NATIONAL' });

  const [users, setUsers] = useState<any[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [resetPasswordModal, setResetPasswordModal] = useState<{ userId: string; tempPassword: string } | null>(null);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);

  const tabs = [
    { id: 'company', label: 'Company', icon: Building },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, onClick: () => navigate('/settings/roles') },
    { id: 'audit', label: 'Audit Log', icon: Shield },
  ];

  useEffect(() => {
    loadTabData();
  }, [activeTab, holidayYear, userPage, userRoleFilter, userStatusFilter, auditPage]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'company') {
        const data = await settingsApi.getCompanySettings();
        setCompanySettings({
          companyName: data.companyName || '',
          address: data.address || '',
          gstin: data.gstin || '',
          phone: data.phone || '',
          email: data.email || '',
          financialYearStart: data.financialYearStart || 4,
        });
      } else if (activeTab === 'holidays') {
        const data = await settingsApi.getHolidays(holidayYear);
        setHolidays(data);
      } else if (activeTab === 'users') {
        const data = await settingsApi.getAllUsers({
          page: userPage,
          limit: 15,
          role: userRoleFilter || undefined,
          status: userStatusFilter || undefined,
        });
        setUsers(data.data);
        setUsersTotal(data.total);
      } else if (activeTab === 'audit') {
        const data = await settingsApi.getAuditLogs({ page: auditPage, limit: 20 });
        setAuditLogs(data.data);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await settingsApi.updateCompanySettings(companySettings);
      toast.success('Company settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await settingsApi.createHoliday(newHoliday);
      toast.success('Holiday added');
      setShowAddHoliday(false);
      setNewHoliday({ name: '', date: '', type: 'NATIONAL' });
      loadTabData();
    } catch {
      toast.error('Failed to add holiday');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Delete this holiday?')) return;
    try {
      await settingsApi.deleteHoliday(id);
      toast.success('Holiday deleted');
      loadTabData();
    } catch {
      toast.error('Failed to delete holiday');
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await settingsApi.updateUserRole(userId, role);
      toast.success('Role updated');
      loadTabData();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await settingsApi.deactivateUser(userId);
      toast.success('User deactivated');
      loadTabData();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const result = await settingsApi.resetUserPassword(userId);
      setResetPasswordModal({ userId, tempPassword: result.tempPassword });
      toast.success('Password reset');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration" />

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if ('onClick' in tab && tab.onClick) {
                    tab.onClick();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {activeTab === 'company' && (
                <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold mb-6">Company Settings</h3>
                  <div className="space-y-4 max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium mb-2">Company Name</label>
                      <input
                        value={companySettings.companyName}
                        onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Address</label>
                      <textarea
                        value={companySettings.address}
                        onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">GSTIN</label>
                        <input
                          value={companySettings.gstin}
                          onChange={(e) => setCompanySettings({ ...companySettings, gstin: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone</label>
                        <input
                          value={companySettings.phone}
                          onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                          value={companySettings.email}
                          onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Financial Year Start</label>
                        <select
                          value={companySettings.financialYearStart}
                          onChange={(e) => setCompanySettings({ ...companySettings, financialYearStart: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                        >
                          <option value={1}>January</option>
                          <option value={4}>April</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={handleSaveCompany}
                      disabled={saving}
                      className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'holidays' && (
                <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Holidays</h3>
                    <div className="flex items-center gap-3">
                      <select
                        value={holidayYear}
                        onChange={(e) => setHolidayYear(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm"
                      >
                        {[2024, 2025, 2026, 2027].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowAddHoliday(true)}
                        className="px-4 py-2 bg-accent text-white rounded-lg text-sm flex items-center gap-2"
                      >
                        <Plus size={16} /> Add Holiday
                      </button>
                    </div>
                  </div>

                  {showAddHoliday && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="grid grid-cols-3 gap-4">
                        <input
                          placeholder="Holiday Name"
                          value={newHoliday.name}
                          onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                        />
                        <input
                          type="date"
                          value={newHoliday.date}
                          onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                        />
                        <select
                          value={newHoliday.type}
                          onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value })}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                        >
                          <option value="NATIONAL">National</option>
                          <option value="OPTIONAL">Optional</option>
                          <option value="COMPANY">Company</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setShowAddHoliday(false)} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm">Cancel</button>
                        <button onClick={handleAddHoliday} className="px-3 py-1 bg-accent text-white rounded text-sm">Add</button>
                      </div>
                    </div>
                  )}

                  {holidays.length === 0 ? (
                    <EmptyState title="No holidays" description="No holidays configured for this year." icon={Calendar} />
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3">Name</th>
                          <th className="text-left py-3">Date</th>
                          <th className="text-left py-3">Type</th>
                          <th className="text-right py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holidays.map((h) => (
                          <tr key={h.id} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-3 font-medium">{h.name}</td>
                            <td className="py-3">{new Date(h.date).toLocaleDateString('en-IN')}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                h.type === 'NATIONAL' ? 'bg-blue-100 text-blue-800' :
                                h.type === 'OPTIONAL' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>{h.type}</span>
                            </td>
                            <td className="py-3 text-right">
                              <button onClick={() => handleDeleteHoliday(h.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'payroll' && (
                <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold mb-6">Payroll Defaults</h3>
                  <div className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">PF Employee %</label>
                        <input type="number" step="0.01" value={12} readOnly className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">PF Employer %</label>
                        <input type="number" step="0.01" value={12} readOnly className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ESI Employee %</label>
                        <input type="number" step="0.01" value={0.75} readOnly className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ESI Employer %</label>
                        <input type="number" step="0.01" value={3.25} readOnly className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 bg-gray-50" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Default payroll rates are configured per-employee in their salary structure.</p>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">User Management</h3>
                    <div className="flex gap-2">
                      <select value={userRoleFilter} onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm">
                        <option value="">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="HR">HR</option>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="INTERN">Intern</option>
                      </select>
                      <select value={userStatusFilter} onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm">
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3">Employee ID</th>
                        <th className="text-left py-3">Name</th>
                        <th className="text-left py-3">Email</th>
                        <th className="text-left py-3">Role</th>
                        <th className="text-left py-3">Status</th>
                        <th className="text-right py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 font-mono text-xs">{u.employeeId}</td>
                          <td className="py-3">{u.firstName} {u.lastName}</td>
                          <td className="py-3 text-gray-500">{u.email}</td>
                          <td className="py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-800"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="HR">HR</option>
                              <option value="EMPLOYEE">EMPLOYEE</option>
                              <option value="INTERN">INTERN</option>
                            </select>
                          </td>
                          <td className="py-3">
                            <StatusBadge status={u.status} />
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleResetPassword(u.id)} className="text-xs text-accent hover:underline">Reset PW</button>
                              <button onClick={() => handleDeactivate(u.id)} className="text-xs text-red-500 hover:underline">Deactivate</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {usersTotal > 15 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button onClick={() => setUserPage(Math.max(1, userPage - 1))} disabled={userPage === 1} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50">Prev</button>
                      <span className="px-3 py-1 text-sm text-gray-500">Page {userPage}</span>
                      <button onClick={() => setUserPage(userPage + 1)} disabled={users.length < 15} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50">Next</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold mb-6">Audit Log</h3>
                  {auditLogs.length === 0 ? (
                    <EmptyState title="No audit logs" description="No activity recorded yet." icon={Shield} />
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3">Timestamp</th>
                          <th className="text-left py-3">User</th>
                          <th className="text-left py-3">Action</th>
                          <th className="text-left py-3">Entity</th>
                          <th className="text-left py-3">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log: any) => (
                          <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-3 text-xs">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                            <td className="py-3">{log.user?.firstName} {log.user?.lastName}</td>
                            <td className="py-3"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{log.action}</span></td>
                            <td className="py-3 text-gray-500">{log.entity}</td>
                            <td className="py-3 text-gray-500 text-xs">{log.details || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div className="flex justify-center gap-2 mt-4">
                    <button onClick={() => setAuditPage(Math.max(1, auditPage - 1))} disabled={auditPage === 1} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50">Prev</button>
                    <span className="px-3 py-1 text-sm text-gray-500">Page {auditPage}</span>
                    <button onClick={() => setAuditPage(auditPage + 1)} disabled={auditLogs.length < 20} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Password Reset</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Temp password:</p>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm break-all">{resetPasswordModal.tempPassword}</div>
            <button onClick={() => setResetPasswordModal(null)} className="mt-4 w-full px-4 py-2 bg-accent text-white rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;