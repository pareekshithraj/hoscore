import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bed, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { Modal } from '../components/Modal';

const statusStyles: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800',
  OCCUPIED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-amber-100 text-amber-800',
  CLEANING: 'bg-slate-100 text-slate-800',
};

export const Rooms = () => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'beds'>('rooms');
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);

  const [roomData, setRoomData] = useState({ hospitalId: 'h1', name: '', type: 'Ward', capacity: 1, basePrice: 50 });
  const [bedData, setBedData] = useState({ roomId: '', bedNumber: '', pricePerDay: 50 });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/rooms'),
      api.get('/beds')
    ]).then(([roomsRes, bedsRes]) => {
      setRooms(roomsRes);
      setBeds(bedsRes);
      if (roomsRes.length > 0 && !bedData.roomId) {
        setBedData(prev => ({ ...prev, roomId: roomsRes[0].id }));
      }
    }).finally(() => setLoading(false));
  };

  const handleDelete = async (id: string, type: 'room' | 'bed') => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await api.delete(`/${type}s/${id}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/rooms', { ...roomData, capacity: Number(roomData.capacity), basePrice: Number(roomData.basePrice) });
      setIsRoomModalOpen(false);
      setRoomData({ hospitalId: 'h1', name: '', type: 'Ward', capacity: 1, basePrice: 50 });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/beds', { ...bedData, pricePerDay: Number(bedData.pricePerDay) });
      setIsBedModalOpen(false);
      setBedData(prev => ({ ...prev, bedNumber: '', pricePerDay: 50 }));
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
        <div className="animate-pulse">Loading hospital facilities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Room & Bed Management</h2>
          <p className="text-slate-500">Manage hospital categories, pricing, and occupancy.</p>
        </div>
        <button 
          onClick={() => activeTab === 'rooms' ? setIsRoomModalOpen(true) : setIsBedModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New {activeTab === 'rooms' ? 'Room' : 'Bed'}
        </button>
      </div>

      <Modal 
        isOpen={isRoomModalOpen} 
        onClose={() => setIsRoomModalOpen(false)} 
        title="Add New Room"
      >
        <form onSubmit={handleRoomSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Room Name</label>
            <input required value={roomData.name} onChange={e => setRoomData({...roomData, name: e.target.value})} type="text" placeholder="e.g. Ward - B" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Room Type</label>
            <select value={roomData.type} onChange={e => setRoomData({...roomData, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Ward</option>
              <option>ICU</option>
              <option>Private</option>
              <option>Semi-Private</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacity (Beds)</label>
            <input required value={roomData.capacity} onChange={e => setRoomData({...roomData, capacity: Number(e.target.value)})} type="number" placeholder="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Base Price ($)</label>
            <input required value={roomData.basePrice} onChange={e => setRoomData({...roomData, basePrice: Number(e.target.value)})} type="number" placeholder="50" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsRoomModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Save Room
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isBedModalOpen} 
        onClose={() => setIsBedModalOpen(false)} 
        title="Add New Bed"
      >
        <form onSubmit={handleBedSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Room</label>
            <select required value={bedData.roomId} onChange={e => setBedData({...bedData, roomId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a Room</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bed Number</label>
            <input required value={bedData.bedNumber} onChange={e => setBedData({...bedData, bedNumber: e.target.value})} type="text" placeholder="e.g. B-101" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price per Day ($)</label>
            <input required value={bedData.pricePerDay} onChange={e => setBedData({...bedData, pricePerDay: Number(e.target.value)})} type="number" placeholder="50" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsBedModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Save Bed
            </button>
          </div>
        </form>
      </Modal>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('rooms')}
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'rooms' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Rooms
          {activeTab === 'rooms' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('beds')}
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'beds' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Beds
          {activeTab === 'beds' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Filter ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none">
          <option>All Types</option>
          {activeTab === 'rooms' ? (
            <>
              <option>Ward</option>
              <option>ICU</option>
              <option>Private</option>
            </>
          ) : (
            <>
              <option>Available</option>
              <option>Occupied</option>
              <option>Maintenance</option>
            </>
          )}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {activeTab === 'rooms' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Room Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Occupancy</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Base Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Bed className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-900">{room.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {room.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{room.capacity} Beds</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-slate-500">{room.beds?.filter((b:any)=>b.status==='OCCUPIED').length || 0}/{room.capacity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">${room.basePrice || 0}/day</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(room.id, 'room')} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bed Number</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {beds.map((bed) => (
                <tr key={bed.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-slate-900">{bed.bedNumber}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{bed.room?.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[bed.status]}`}>
                      {bed.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="text-slate-400 italic">None</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">${bed.pricePerDay || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(bed.id, 'bed')} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
