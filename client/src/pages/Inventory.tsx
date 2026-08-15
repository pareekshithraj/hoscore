import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Search, AlertTriangle, Package, Edit2, Trash2, RefreshCw, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusPill } from '../components/ui/StatusPill';
import { formatINR } from '../utils/clinical';

interface InventoryItem {
  id: string;
  itemName: string;
  type: string;
  stock: number;
  reorderLevel: number;
  unit: string;
  price: number;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const itemTypes = ['Medicine', 'Consumable', 'Equipment', 'Lab Reagent'];
  
  const [formData, setFormData] = useState({ itemName: '', type: 'Medicine', stock: 100, reorderLevel: 20, price: 10, supplier: '', batchNumber: '', expiryDate: '' });
  const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(0);

  const fetchInventory = () => {
    setLoading(true);
    api.get('/inventory')
      .then(res => setInventory(res || []))
      .finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/inventory/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchInventory();
    } catch (err) { console.error(err); }
  };

  const handleRestock = async () => {
    if (!restockTarget) return;
    try {
      await api.patch(`/inventory/${restockTarget.id}/stock`, { stock: restockTarget.stock + Number(restockQty || 0) });
      setRestockTarget(null);
      setRestockQty(0);
      fetchInventory();
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory', { ...formData, stock: Number(formData.stock), reorderLevel: Number(formData.reorderLevel), price: Number(formData.price) });
      setIsModalOpen(false);
      setFormData({ itemName: '', type: 'Medicine', stock: 100, reorderLevel: 20, price: 10, supplier: '', batchNumber: '', expiryDate: '' });
      fetchInventory();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <LoadingState label="Loading medical supplies..." />;
  }

  const byType = typeFilter === 'All' ? inventory : inventory.filter(i => i.type === typeFilter);
  const filtered = !searchQuery ? byType : byType.filter(i =>
    i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.supplier || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const lowStockCount = inventory.filter(i => i.stock <= i.reorderLevel).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        subtitle="Manage medicines, equipment, and medical consumables stock level"
        icon={<Package className="w-5 h-5" />}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        }
      />

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            <span className="font-bold">{lowStockCount} items</span> are at or below reorder level. Consider restocking soon.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
          />
        </div>
        <div className="flex gap-1 bg-[var(--inner-bg)] p-1.5 rounded-xl border border-[var(--card-border)] overflow-x-auto">
          {['All', ...itemTypes].map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                typeFilter === f
                  ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--inner-bg)] border-b border-[var(--card-border)]">
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Stock Level</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Unit Price</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {filtered.map((item) => {
              const isLow = item.stock <= item.reorderLevel;
              return (
                <tr key={item.id} className="hover:bg-[var(--inner-bg)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        isLow ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-[var(--inner-bg)] border-[var(--card-border)] text-[var(--text-muted)]'
                      }`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{item.itemName}</p>
                        <p className="text-xs text-[var(--text-muted)]">Reorder at: {item.reorderLevel} {item.unit || 'units'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill tone="neutral">{item.type}</StatusPill>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-sm ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-primary)]'}`}>{item.stock}</span>
                      <span className="text-xs text-[var(--text-muted)]">{item.unit || 'units'}</span>
                      {isLow && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="mt-1.5 h-1.5 w-32 bg-[var(--inner-bg)] rounded-full overflow-hidden border border-[var(--card-border)]">
                      <div className={`h-full rounded-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (item.stock / (item.reorderLevel * 3)) * 100)}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">{item.supplier || '—'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)]">{formatINR(item.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setRestockTarget(item); setRestockQty(item.reorderLevel); }} className="p-1.5 text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-sky-400 hover:bg-[var(--inner-bg)] rounded-lg cursor-pointer transition-colors" title="Restock"><RefreshCw className="w-4 h-4" /></button>
                      <button className="p-1.5 text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-sky-400 hover:bg-[var(--inner-bg)] rounded-lg cursor-pointer transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <EmptyState
            icon={<Package className="w-8 h-8 text-[var(--text-muted)]" />}
            title="No inventory items found"
            description="Add inventory items to track stocks and reorder thresholds"
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Inventory Item">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Item Name</label>
            <input required value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} type="text" placeholder="e.g. Paracetamol 500mg" className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Item Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold text-[var(--text-primary)] focus:outline-none">
                {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Initial Stock</label>
              <input required value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} type="number" placeholder="100" className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold text-[var(--text-primary)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Reorder Level</label>
              <input required value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})} type="number" placeholder="50" className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold text-[var(--text-primary)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Unit Price (₹)</label>
              <input required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} type="number" step="0.01" placeholder="0.00" className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold text-[var(--text-primary)] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Supplier</label>
            <input value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} type="text" placeholder="Supplier name" className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold text-[var(--text-primary)] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Batch</label>
              <input value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} type="text" placeholder="Batch no." className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Expiry</label>
              <input value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} type="date" className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[var(--card-border)] rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--inner-bg)] cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md cursor-pointer">Add Item</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-[var(--card-bg)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Delete Item</h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-5 text-sm text-[var(--text-primary)]">Are you sure you want to remove <strong>{deleteTarget.itemName}</strong> from inventory?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--inner-bg)] cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-md cursor-pointer">Delete Item</button>
            </div>
          </div>
        </div>
      )}

      {restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <h3 className="font-bold mb-2">Restock {restockTarget.itemName}</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">Current stock {restockTarget.stock}</p>
            <input type="number" value={restockQty} onChange={(e) => setRestockQty(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setRestockTarget(null)} className="flex-1 rounded-xl border px-4 py-2 text-xs font-bold">Cancel</button>
              <button onClick={handleRestock} className="flex-1 rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold">Add stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

