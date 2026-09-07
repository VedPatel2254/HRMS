import { useState, useEffect } from 'react';
import { Monitor, Plus, UserPlus, RotateCcw, Search, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import * as assetApi from '../../api/asset.api';
import toast from 'react-hot-toast';

interface Asset {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
  status: string;
  purchaseDate: string | null;
  purchasePrice: number | null;
  condition: string | null;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  } | null;
}

const AssetsPage = () => {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR';
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', status: '', assignedTo: '' });
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'LAPTOP',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    condition: 'Good',
    notes: '',
  });

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, typeFilter]);

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const result = await assetApi.getAllAssets({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setAssets(result.data || []);
    } catch (error) {
      toast.error('Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.name) {
      toast.error('Please enter asset name');
      return;
    }

    try {
      await assetApi.createAsset({
        ...newAsset,
        purchasePrice: newAsset.purchasePrice ? parseFloat(newAsset.purchasePrice) : undefined,
      });
      toast.success('Asset added successfully');
      setShowAddAsset(false);
      setNewAsset({
        name: '',
        type: 'LAPTOP',
        serialNumber: '',
        purchaseDate: '',
        purchasePrice: '',
        condition: 'Good',
        notes: '',
      });
      fetchAssets();
    } catch (error) {
      toast.error('Failed to add asset');
    }
  };

  const handleAssign = async (assetId: string) => {
    if (!assignUserId) {
      toast.error('Please enter user ID');
      return;
    }

    try {
      await assetApi.assignAsset(assetId, assignUserId);
      toast.success('Asset assigned successfully');
      setShowAssignModal(null);
      setAssignUserId('');
      fetchAssets();
    } catch (error) {
      toast.error('Failed to assign asset');
    }
  };

  const handleReturn = async (assetId: string) => {
    if (!confirm('Are you sure you want to mark this asset as returned?')) return;

    try {
      await assetApi.returnAsset(assetId);
      toast.success('Asset returned successfully');
      fetchAssets();
    } catch (error) {
      toast.error('Failed to return asset');
    }
  };

  const handleEditStart = (asset: Asset) => {
    setEditingAsset(asset.id);
    setEditForm({
      name: asset.name,
      status: asset.status,
      assignedTo: asset.assignee?.employeeId || '',
    });
  };

  const handleEditSave = async (assetId: string) => {
    try {
      await assetApi.updateAsset(assetId, {
        name: editForm.name,
        status: editForm.status,
      });
      toast.success('Asset updated successfully');
      setEditingAsset(null);
      fetchAssets();
    } catch (error) {
      toast.error('Failed to update asset');
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) return;

    try {
      await assetApi.deleteAsset(assetId);
      toast.success('Asset deleted');
      fetchAssets();
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      case 'RETIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LAPTOP': return '💻';
      case 'PHONE': return '📱';
      case 'MONITOR': return '🖥️';
      case 'PERIPHERAL': return '🖱️';
      default: return '📦';
    }
  };

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle="Manage company assets and equipment"
        action={{
          label: 'Add Asset',
          onClick: () => setShowAddAsset(true),
          icon: Plus,
        }}
      />

      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
        >
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
        >
          <option value="">All Types</option>
          <option value="LAPTOP">Laptop</option>
          <option value="PHONE">Phone</option>
          <option value="MONITOR">Monitor</option>
          <option value="PERIPHERAL">Peripheral</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {showAddAsset && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Asset</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="e.g. Dell XPS 15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={newAsset.type}
                onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              >
                <option value="LAPTOP">Laptop</option>
                <option value="PHONE">Phone</option>
                <option value="MONITOR">Monitor</option>
                <option value="PERIPHERAL">Peripheral</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Serial Number</label>
              <input
                value={newAsset.serialNumber}
                onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Purchase Date</label>
              <input
                type="date"
                value={newAsset.purchaseDate}
                onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Purchase Price (₹)</label>
              <input
                type="number"
                value={newAsset.purchasePrice}
                onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Condition</label>
              <select
                value={newAsset.condition}
                onChange={(e) => setNewAsset({ ...newAsset, condition: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={newAsset.notes}
                onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddAsset(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAsset}
              className="px-4 py-2 bg-accent text-white rounded-lg"
            >
              Add Asset
            </button>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Assign Asset</h3>
          <div>
            <label className="block text-sm font-medium mb-2">Employee ID or User ID</label>
            <input
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              placeholder="Enter employee ID (e.g. PRS-001)"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowAssignModal(null);
                setAssignUserId('');
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAssign(showAssignModal)}
              className="px-4 py-2 bg-accent text-white rounded-lg"
            >
              Assign
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          title="No assets"
          description="Add your first asset to get started."
          icon={Monitor}
        />
      ) : (
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    {editingAsset === asset.id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 text-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTypeIcon(asset.type)}</span>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          {asset.purchasePrice && (
                            <div className="text-sm text-gray-500">
                              ₹{asset.purchasePrice.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{asset.type}</td>
                  <td className="px-6 py-4 text-sm font-mono">{asset.serialNumber || '-'}</td>
                  <td className="px-6 py-4">
                    {editingAsset === asset.id ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 text-xs"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="RETIRED">RETIRED</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {asset.assignee
                      ? `${asset.assignee.firstName} ${asset.assignee.lastName}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {editingAsset === asset.id ? (
                        <>
                          <button
                            onClick={() => handleEditSave(asset.id)}
                            className="text-green-600 hover:text-green-700 text-xs font-medium"
                            title="Save"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingAsset(null)}
                            className="text-gray-500 hover:text-gray-600 text-xs font-medium"
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {asset.status === 'AVAILABLE' && (
                            <button
                              onClick={() => setShowAssignModal(asset.id)}
                              className="text-accent hover:text-accent/80"
                              title="Assign"
                            >
                              <UserPlus size={16} />
                            </button>
                          )}
                          {asset.status === 'ASSIGNED' && (
                            <button
                              onClick={() => handleReturn(asset.id)}
                              className="text-yellow-500 hover:text-yellow-600"
                              title="Return"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                          {isAdminOrHR && (
                            <>
                              <button
                                onClick={() => handleEditStart(asset)}
                                className="text-blue-500 hover:text-blue-600"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(asset.id)}
                                className="text-red-500 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </>
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

export default AssetsPage;
