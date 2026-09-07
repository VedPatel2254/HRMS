import { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, MapPin, Shield, Save, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuthStore } from '../../store/authStore';
import { getEmployee, updateEmployee } from '../../api/employee.api';
import { changePassword } from '../../api/auth.api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activeSection, setActiveSection] = useState('personal');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await getEmployee(user.id);
      if (res.success && res.data) {
        const emp = res.data as any;
        setEmployee(emp);
        setEditData({
          phone: emp.phone || '',
          dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '',
          address: emp.address || '',
          emergencyContactName: emp.emergencyContactName || '',
          emergencyContactPhone: emp.emergencyContactPhone || '',
        });
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonal = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await updateEmployee(user.id, editData);
      if (res.success) {
        toast.success('Profile updated');
        setEditing(false);
        fetchProfile();
      } else {
        toast.error(res.message || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (res.success) {
        toast.success('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(res.message || 'Failed to change password');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="My Profile" subtitle="Manage your profile" />

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0">
          {/* Left Card - Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-col items-center">
                <Avatar
                  name={`${employee?.firstName || ''} ${employee?.lastName || ''}`}
                  src={employee?.profilePicture}
                  size="lg"
                />
                <h2 className="text-xl font-bold mt-4 text-gray-900 dark:text-white text-center">
                  {employee?.firstName} {employee?.lastName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{employee?.employeeId}</p>
                <div className="mt-2"><StatusBadge status={employee?.status} /></div>
                {employee?.designation && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{employee.designation}</p>
                )}
                {employee?.role && (
                  <p className="text-sm text-accent mt-1">{employee.role}</p>
                )}
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300 break-all">{employee?.email}</span>
                </div>
                {employee?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{employee.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Joined {employee?.dateOfJoining
                      ? new Date(employee.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '--'}
                  </span>
                </div>
                {employee?.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{employee.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right - Tab Sections */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-4">
              {[
                { id: 'personal', label: 'Personal Info' },
                { id: 'bank', label: 'Bank Details' },
                { id: 'password', label: 'Change Password' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === tab.id
                      ? 'bg-accent text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Personal Info */}
            {activeSection === 'personal' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                  <button
                    onClick={() => {
                      setEditing(!editing);
                      if (editing) {
                        setEditData({
                          phone: employee?.phone || '',
                          dateOfBirth: employee?.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
                          address: employee?.address || '',
                          emergencyContactName: employee?.emergencyContactName || '',
                          emergencyContactPhone: employee?.emergencyContactPhone || '',
                        });
                      }
                    }}
                    className="text-sm text-accent hover:underline"
                  >
                    {editing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">First Name</label>
                      <input
                        value={employee?.firstName || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Last Name</label>
                      <input
                        value={employee?.lastName || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      value={employee?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                    />
                  </div>

                  <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
                    <input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent focus:outline-none"
                    />
                  </div>

                  <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Date of Birth</label>
                    <input
                      type="date"
                      value={editData.dateOfBirth}
                      onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent focus:outline-none"
                    />
                  </div>

                  <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Address</label>
                      <textarea
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      disabled={!editing}
                      rows={1}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Emergency Contact Name</label>
                      <input
                        value={editData.emergencyContactName}
                        onChange={(e) => setEditData({ ...editData, emergencyContactName: e.target.value })}
                        disabled={!editing}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Emergency Contact Phone</label>
                      <input
                        value={editData.emergencyContactPhone}
                        onChange={(e) => setEditData({ ...editData, emergencyContactPhone: e.target.value })}
                        disabled={!editing}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleSavePersonal}
                      disabled={saving}
                      className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditData({
                          phone: employee?.phone || '',
                          dateOfBirth: employee?.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
                          address: employee?.address || '',
                          emergencyContactName: employee?.emergencyContactName || '',
                          emergencyContactPhone: employee?.emergencyContactPhone || '',
                        });
                      }}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bank Details */}
            {activeSection === 'bank' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Bank Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Bank Name</label>
                    <input
                      value={employee?.bankName || '--'}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Account Number</label>
                    <input
                      value={employee?.bankAccountNumber ? '****' + employee.bankAccountNumber.slice(-4) : '--'}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">IFSC Code</label>
                    <input
                      value={employee?.bankIFSC || '--'}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">PAN Number</label>
                    <input
                      value={employee?.panNumber || '--'}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Change Password */}
            {activeSection === 'password' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Min 8 characters, 1 uppercase, 1 number, 1 special char</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 flex items-center gap-2 disabled:opacity-50"
                  >
                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield size={16} />}
                    Change Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
