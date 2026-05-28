import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Search, AlertTriangle, Package, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Modal } from '../components/Modal';

export const Inventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const itemTypes = ['Medicine', 'Consumable', 'Equipment', 'Lab Reagent'];
  
  const [formData, setFormData] = useState({ itemName: '', type: 'Medicine', stock: 100, reorderLevel: 20, price: 10, supplier: '' });

  const fetchInventory = () => {
    setLoading(true);
    api.get('/inventory')
      .then(res => setInventory(res))
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
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
      setFormData({ itemName: '', type: 'Medicine', stock: 100, reorderLevel: 20, price: 10, supplier: '' });
      fetchInventory();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
        <div className="animate-pulse">Loading medical supplies...</div>
      </div>
    );
  }

  const filtered = typeFilter === 'All' ? inventory : inventory.filter(i => i.type === typeFilter);
  const lowStockCount = inventory.filter(i => i.stock <= i.reorderLevel).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
          <p className="text-slate-500">Manage medicines, equipment, and consumables stock.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            <span className="font-bold">{lowStockCount} items</span> are at or below reorder level. Consider restocking soon.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search inventory..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {['All', ...itemTypes].map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${typeFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Level</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Price</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((item) => {
              const isLow = item.stock <= item.reorderLevel;
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLow ? 'bg-amber-100' : 'bg-slate-100'}`}>
                        <Package className={`w-4 h-4 ${isLow ? 'text-amber-600' : 'text-slate-500'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.itemName}</p>
                        <p className="text-xs text-slate-400">Reorder at: {item.reorderLevel} {item.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{item.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>{item.stock}</span>
                      <span className="text-xs text-slate-400">{item.unit}</span>
                      {isLow && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="mt-1 h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (item.stock / (item.reorderLevel * 3)) * 100)}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.supplier}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">${item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Restock"><RefreshCw className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Inventory Item">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
            <input required value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} type="text" placeholder="e.g. Paracetamol 500mg" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
              <input required value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} type="number" placeholder="100" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
              <input required value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})} type="number" placeholder="50" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price ($)</label>
              <input required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} type="number" step="0.01" placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
            <input value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} type="text" placeholder="Supplier name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Item</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
