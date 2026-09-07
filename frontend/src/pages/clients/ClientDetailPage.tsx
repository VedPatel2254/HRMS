import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit, Mail, Phone, Globe, MapPin } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import ClientFormModal from '../../components/clients/ClientFormModal';
import * as clientApi from '../../api/client.api';
import toast from 'react-hot-toast';

interface ClientData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  industry: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  gstin: string | null;
  website: string | null;
  status: string;
  createdAt: string;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    startDate: string | null;
    endDate: string | null;
    _count: { tasks: number; members: number };
  }>;
}

const statusColors: Record<string, string> = {
  PLANNING: 'bg-gray-100 dark:bg-gray-800 text-gray-600',
  ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-600',
  ON_HOLD: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600',
  COMPLETED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
  CANCELLED: 'bg-red-100 dark:bg-red-900/20 text-red-600',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 dark:bg-gray-800 text-gray-600',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
  HIGH: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600',
  CRITICAL: 'bg-red-100 dark:bg-red-900/20 text-red-600',
};

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchClient = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await clientApi.getClient(id);
      setClient(response.data as unknown as ClientData);
    } catch {
      toast.error('Failed to load client');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const handleUpdate = async (data: Partial<ClientData>) => {
    if (!id) return;
    try {
      await clientApi.updateClient(id, data);
      toast.success('Client updated');
      setShowEditModal(false);
      fetchClient();
    } catch {
      toast.error('Failed to update client');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12 text-gray-500">
        Client not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <PageHeader
          title={client.name}
          subtitle={client.industry || 'Client'}
        />
        <button
          onClick={() => setShowEditModal(true)}
          className="ml-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{client.phone}</span>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {client.website}
                  </a>
                </div>
              )}
              {client.gstin && (
                <div>
                  <span className="text-gray-500">GSTIN: </span>
                  <span className="text-gray-900 dark:text-white">{client.gstin}</span>
                </div>
              )}
            </div>
            {client.address && (
              <div className="mt-4 flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-600 dark:text-gray-400">{client.address}</span>
              </div>
            )}
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Projects ({client.projects.length})</h3>
            {client.projects.length === 0 ? (
              <p className="text-gray-500 text-sm">No projects yet.</p>
            ) : (
              <div className="space-y-3">
                {client.projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[project.status] || ''}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${priorityColors[project.priority] || ''}`}>
                          {project.priority}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{project._count.tasks} tasks</p>
                      <p>{project._count.members} members</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Person</h3>
            {client.contactPersonName ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900 dark:text-white">{client.contactPersonName}</p>
                {client.contactPersonEmail && (
                  <p className="text-gray-600 dark:text-gray-400">{client.contactPersonEmail}</p>
                )}
                {client.contactPersonPhone && (
                  <p className="text-gray-600 dark:text-gray-400">{client.contactPersonPhone}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No contact person specified.</p>
            )}
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  client.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {client.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(client.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClientFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdate}
        client={client}
      />
    </div>
  );
};

export default ClientDetailPage;
