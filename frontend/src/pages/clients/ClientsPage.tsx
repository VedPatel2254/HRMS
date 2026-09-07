import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Loader2, FolderKanban, Pencil } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import ClientFormModal from '../../components/clients/ClientFormModal';
import * as clientApi from '../../api/client.api';
import toast from 'react-hot-toast';

const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    industry: string | null;
    contactPersonName: string | null;
    status: string;
    _count: { projects: number };
  }>>([]);
  const [stats, setStats] = useState({ active: 0, inactive: 0, totalProjects: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    industry: string;
    contactPersonName: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    gstin: string;
    website: string;
  } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, statsRes] = await Promise.all([
        clientApi.getAllClients({ search: searchTerm || undefined }),
        clientApi.getClientStats(),
      ]);
      setClients(clientsRes.data.data);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchData, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleCreateClient = async (data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    industry?: string;
    contactPersonName?: string;
    contactPersonEmail?: string;
    contactPersonPhone?: string;
    gstin?: string;
    website?: string;
  }) => {
    try {
      await clientApi.createClient(data);
      toast.success('Client created');
      setShowFormModal(false);
      fetchData();
    } catch {
      toast.error('Failed to create client');
    }
  };

  const handleUpdateClient = async (data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    industry?: string;
    contactPersonName?: string;
    contactPersonEmail?: string;
    contactPersonPhone?: string;
    gstin?: string;
    website?: string;
  }) => {
    if (!selectedClient) return;
    try {
      await clientApi.updateClient(selectedClient.id, data);
      toast.success('Client updated');
      setShowFormModal(false);
      setSelectedClient(null);
      fetchData();
    } catch {
      toast.error('Failed to update client');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this client?')) return;
    try {
      await clientApi.deactivateClient(id);
      toast.success('Client deactivated');
      fetchData();
    } catch {
      toast.error('Failed to deactivate client');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Manage your client portfolio"
        icon={<Building2 className="w-5 h-5" />}
        action={
          <button
            onClick={() => setShowFormModal(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Clients"
          value={stats.active}
          icon={Building2}
          colorVariant="success"
        />
        <StatCard
          title="Inactive Clients"
          value={stats.inactive}
          icon={Building2}
          colorVariant="warning"
        />
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          colorVariant="primary"
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No clients found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                  {client.industry && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded">
                      {client.industry}
                    </span>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    client.status === 'ACTIVE'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {client.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {client.contactPersonName && (
                  <p>Contact: {client.contactPersonName}</p>
                )}
                {client.email && <p>{client.email}</p>}
                {client.phone && <p>{client.phone}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <FolderKanban className="w-4 h-4" />
                  <span>{client._count.projects} projects</span>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedClient({ ...client, email: client.email || '', phone: client.phone || '', address: '', industry: client.industry || '', contactPersonName: client.contactPersonName || '', contactPersonEmail: '', contactPersonPhone: '', gstin: '', website: '' }); setShowFormModal(true); }}
                    className="px-3 py-1 text-xs text-accent hover:bg-accent/10 rounded transition-colors flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  {client.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleDeactivate(client.id)}
                      className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormModal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setSelectedClient(null); }}
        onSubmit={selectedClient ? handleUpdateClient : handleCreateClient}
        client={selectedClient}
      />
    </div>
  );
};

export default ClientsPage;
