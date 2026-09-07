import { useState, useEffect } from 'react';
import { LifeBuoy, Plus, CheckCircle, Clock, AlertCircle, UserPlus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import * as helpdeskApi from '../../api/helpdesk.api';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  raiser?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId?: string;
  };
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

const HelpdeskPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'IT',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      if (isAdmin) {
        const result = await helpdeskApi.getAllTickets({
          status: statusFilter || undefined,
        });
        setTickets(result.data || []);
      } else {
        const data = await helpdeskApi.getMyTickets();
        setTickets(data);
      }
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees', { params: { status: 'ACTIVE', limit: 100 } });
      const empData = response.data?.data?.data || response.data?.data || [];
      setEmployees(empData);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await helpdeskApi.createTicket(newTicket);
      toast.success('Ticket created successfully');
      setShowCreateForm(false);
      setNewTicket({
        title: '',
        description: '',
        category: 'IT',
        priority: 'MEDIUM',
      });
      fetchTickets();
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const handleResolve = async (id: string) => {
    const resolution = prompt('Enter resolution notes:');
    if (resolution === null) return;

    try {
      await helpdeskApi.resolveTicket(id, resolution || undefined);
      toast.success('Ticket resolved');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to resolve ticket');
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm('Are you sure you want to close this ticket?')) return;

    try {
      await helpdeskApi.closeTicket(id);
      toast.success('Ticket closed');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to close ticket');
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await api.delete(`/helpdesk/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      toast.success('Ticket deleted');
    } catch (error) {
      toast.error('Failed to delete ticket');
    }
  };

  const openAssignModal = async (ticketId: string) => {
    setAssigningTicketId(ticketId);
    setEmployeeSearch('');
    setShowAssignModal(true);
    await fetchEmployees();
  };

  const handleAssign = async (employeeId: string) => {
    if (!assigningTicketId) return;

    try {
      await helpdeskApi.assignTicket(assigningTicketId, employeeId);
      toast.success('Ticket assigned');
      setShowAssignModal(false);
      setAssigningTicketId(null);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      IT: 'IT Support',
      HR: 'HR Query',
      ADMIN: 'Admin',
      OTHER: 'Other',
    };
    return labels[category] || category;
  };

  const filteredEmployees = employees.filter((emp) => {
    const search = employeeSearch.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(search) ||
      emp.lastName.toLowerCase().includes(search) ||
      emp.employeeId.toLowerCase().includes(search)
    );
  });

  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED').length;

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Helpdesk Management' : 'My Helpdesk'}
        subtitle={isAdmin ? 'Manage support tickets' : 'Raise and track support tickets'}
        action={{
          label: 'Raise Ticket',
          onClick: () => setShowCreateForm(true),
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle size={20} className="text-blue-500" />
            <span className="text-sm text-gray-500">Open</span>
          </div>
          <div className="text-3xl font-bold">{openTickets}</div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-yellow-500" />
            <span className="text-sm text-gray-500">In Progress</span>
          </div>
          <div className="text-3xl font-bold">{inProgressTickets}</div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-sm text-gray-500">Resolved</span>
          </div>
          <div className="text-3xl font-bold">{resolvedTickets}</div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 mb-6">
          {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      )}

      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Raise New Ticket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                  placeholder="Detailed description of the issue..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                  >
                    <option value="IT">IT Support</option>
                    <option value="HR">HR Query</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-4 py-2 bg-accent text-white rounded-lg"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAssignModal && (
        <Modal onClose={() => { setShowAssignModal(false); setAssigningTicketId(null); }}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Assign Ticket</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="Search by name or employee ID..."
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No employees found</div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleAssign(emp.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <UserPlus size={16} className="text-accent" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs text-gray-500">{emp.employeeId}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets"
          description="You haven't raised any tickets yet."
          icon={LifeBuoy}
        />
      ) : (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div className="font-medium">{ticket.title}</div>
                    <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {ticket.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {isAdmin && ticket.raiser
                        ? `By ${ticket.raiser.firstName} ${ticket.raiser.lastName}${ticket.raiser.employeeId ? ` (${ticket.raiser.employeeId})` : ''}`
                        : !isAdmin ? 'By You' : ''}
                      {' • '}
                      {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{getCategoryLabel(ticket.category)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-sm">
                      {ticket.assignee
                        ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                        : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {isAdmin && ticket.status === 'OPEN' && (
                        <button
                          onClick={() => openAssignModal(ticket.id)}
                          className="text-accent hover:text-accent/80 text-sm"
                        >
                          Assign
                        </button>
                      )}
                      {isAdmin && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleResolve(ticket.id)}
                          className="text-green-500 hover:text-green-600 text-sm"
                        >
                          Resolve
                        </button>
                      )}
                      {ticket.status === 'RESOLVED' && (
                        <button
                          onClick={() => handleClose(ticket.id)}
                          className="text-gray-500 hover:text-gray-600 text-sm"
                        >
                          Close
                        </button>
                      )}
                      {ticket.status === 'OPEN' && ticket.raiser?.id === user?.id && (
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete ticket"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HelpdeskPage;
