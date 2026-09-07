import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface RolePerm {
  id: string;
  role: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  attendance: 'Attendance',
  leave: 'Leave Management',
  payroll: 'Payroll',
  tasks: 'Tasks',
  projects: 'Projects',
  clients: 'Clients',
  recruitment: 'Recruitment',
  performance: 'Performance',
  assets: 'Assets',
  expenses: 'Expenses',
  announcements: 'Announcements',
  helpdesk: 'Helpdesk',
  reports: 'Reports',
  settings: 'Settings',
  profile: 'Profile',
};

const PermissionsPage = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [permissions, setPermissions] = useState<RolePerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) fetchPermissions(selectedRole);
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/role-permissions');
      const rolesList = data.data || [];
      setRoles(rolesList);
      if (rolesList.length > 0 && !selectedRole) {
        setSelectedRole(rolesList[0]);
      }
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async (role: string) => {
    try {
      const { data } = await api.get(`/role-permissions/${role}`);
      setPermissions(data.data || []);
    } catch {
      toast.error('Failed to load permissions');
    }
  };

  const handlePermissionChange = (module: string, field: keyof RolePerm, value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === module ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/role-permissions', {
        role: selectedRole,
        permissions: permissions.map(({ role, module, canView, canCreate, canEdit, canDelete, canExport }) => ({
          role, module, canView, canCreate, canEdit, canDelete, canExport,
        })),
      });
      toast.success('Permissions saved');
    } catch {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Enter a role name');
      return;
    }
    const roleName = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');

    try {
      const defaultPerms = permissions.length > 0
        ? permissions.map((p) => ({ ...p, module: p.module, canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }))
        : Object.keys(MODULE_LABELS).map((m) => ({ module: m, canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }));

      await api.post('/role-permissions', { roleName, permissions: defaultPerms });
      toast.success(`Role "${roleName}" created`);
      setShowCreateModal(false);
      setNewRoleName('');
      await fetchRoles();
      setSelectedRole(roleName);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (role: string) => {
    if (!confirm(`Delete role "${role}"? Users with this role will need to be reassigned.`)) return;
    try {
      await api.delete(`/role-permissions/${role}`);
      toast.success('Role deleted');
      setSelectedRole('');
      await fetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete role');
    }
  };

  const toggleModule = (mod: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  };

  const setAllForField = (field: keyof RolePerm, value: boolean) => {
    setPermissions((prev) => prev.map((p) => ({ ...p, [field]: value })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Role Management"
        subtitle="Manage roles and module permissions"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Roles & Permissions' },
        ]}
        action={{
          label: 'New Role',
          onClick: () => setShowCreateModal(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Roles</h3>
            <div className="space-y-1">
              {roles.map((role) => (
                <div key={role} className="flex items-center justify-between group">
                  <button
                    onClick={() => setSelectedRole(role)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedRole === role
                        ? 'bg-accent text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    {role}
                  </button>
                  {!['ADMIN', 'HR', 'EMPLOYEE', 'INTERN'].includes(role) && (
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="ml-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedRole && (
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  {selectedRole} Permissions
                </h3>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-6 gap-2 mb-3 px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  <div className="col-span-2">Module</div>
                  <div className="text-center">View</div>
                  <div className="text-center">Create</div>
                  <div className="text-center">Edit</div>
                  <div className="text-center">Delete</div>
                  <div className="text-center">Export</div>
                </div>

                <div className="grid grid-cols-6 gap-2 mb-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-medium">
                  <div className="col-span-2 flex items-center">ALL MODULES</div>
                  {(['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport'] as const).map((field) => (
                    <div key={field} className="text-center">
                      <input
                        type="checkbox"
                        checked={permissions.every((p) => p[field])}
                        onChange={(e) => setAllForField(field, e.target.checked)}
                        className="w-4 h-4 accent-accent"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  {Object.entries(MODULE_LABELS).map(([mod, label]) => {
                    const perm = permissions.find((p) => p.module === mod);
                    if (!perm) return null;
                    const isExpanded = expandedModules.has(mod);

                    return (
                      <div key={mod}>
                        <div
                          className="grid grid-cols-6 gap-2 items-center px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                          onClick={() => toggleModule(mod)}
                        >
                          <div className="col-span-2 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {label}
                          </div>
                          {(['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport'] as const).map((field) => (
                            <div
                              key={field}
                              className="text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={perm[field]}
                                onChange={(e) => handlePermissionChange(mod, field, e.target.checked)}
                                className="w-4 h-4 accent-accent"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
      <Modal onClose={() => setShowCreateModal(false)}>
        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create New Role</h3>
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="e.g. PROJECT_MANAGER, DEPARTMENT_HEAD"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 mb-4"
            autoFocus
          />
          <p className="text-xs text-gray-500 mb-4">Role name will be saved in UPPERCASE with underscores.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRole}
              className="px-4 py-2 bg-accent text-white rounded-lg"
            >
              Create Role
            </button>
          </div>
        </div>
      </Modal>
      )}
    </div>
  );
};

export default PermissionsPage;
