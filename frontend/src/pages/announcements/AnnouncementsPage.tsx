import { useState, useEffect } from 'react';
import { Megaphone, Plus, AlertTriangle, Info, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import EmptyState from '../../components/shared/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import * as announcementApi from '../../api/announcement.api';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetRoles: string[];
  expiresAt: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', priority: 'MEDIUM', targetRoles: ['ALL'] });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    targetRoles: ['ALL'],
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const data = await announcementApi.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await announcementApi.createAnnouncement(newAnnouncement);
      toast.success('Announcement created');
      setShowCreateForm(false);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'MEDIUM',
        targetRoles: ['ALL'],
      });
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to create announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await announcementApi.deleteAnnouncement(id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const handleEditStart = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setEditForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetRoles: announcement.targetRoles,
    });
  };

  const handleEditSave = async (id: string) => {
    if (!editForm.title || !editForm.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await announcementApi.updateAnnouncement(id, editForm);
      toast.success('Announcement updated');
      setEditingId(null);
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to update announcement');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'HIGH': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'MEDIUM': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'LOW': return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800';
      default: return 'border-l-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertTriangle size={20} className="text-red-500" />;
      case 'HIGH': return <AlertTriangle size={20} className="text-orange-500" />;
      case 'MEDIUM': return <Info size={20} className="text-blue-500" />;
      case 'LOW': return <CheckCircle size={20} className="text-gray-500" />;
      default: return <Info size={20} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'LOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Company-wide announcements and updates"
        action={
          isAdmin
            ? {
                label: 'New Announcement',
                onClick: () => setShowCreateForm(true),
                icon: Plus,
              }
            : undefined
        }
      />

      {showCreateForm && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Announcement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                value={newAnnouncement.title}
                onChange={(e) =>
                  setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content *</label>
              <textarea
                value={newAnnouncement.content}
                onChange={(e) =>
                  setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="Write your announcement..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Audience</label>
                <select
                  value={newAnnouncement.targetRoles[0]}
                  onChange={(e) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      targetRoles: [e.target.value],
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                >
                  <option value="ALL">All Employees</option>
                  <option value="ADMIN">Admin Only</option>
                  <option value="HR">HR Only</option>
                  <option value="EMPLOYEE">Employees Only</option>
                  <option value="INTERN">Interns Only</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-accent text-white rounded-lg"
            >
              Create Announcement
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No announcements"
          description="There are no announcements at the moment."
          icon={Megaphone}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-card-light dark:bg-card-dark rounded-xl border-l-4 border border-gray-200 dark:border-gray-700 p-6 ${getPriorityColor(announcement.priority)}`}
            >
              {editingId === announcement.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Content *</label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Target Audience</label>
                      <select
                        value={editForm.targetRoles[0]}
                        onChange={(e) => setEditForm({ ...editForm, targetRoles: [e.target.value] })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm"
                      >
                        <option value="ALL">All Employees</option>
                        <option value="ADMIN">Admin Only</option>
                        <option value="HR">HR Only</option>
                        <option value="EMPLOYEE">Employees Only</option>
                        <option value="INTERN">Interns Only</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditSave(announcement.id)}
                      className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(announcement.priority)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{announcement.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>
                          By {announcement.user.firstName} {announcement.user.lastName}
                        </span>
                        <span>
                          {new Date(announcement.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {announcement.targetRoles[0] !== 'ALL' && (
                          <span className="text-accent">
                            To: {announcement.targetRoles.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditStart(announcement)}
                        className="text-blue-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
