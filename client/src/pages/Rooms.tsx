import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { AlertTriangle, Bed, Plus, Trash2, X, Pencil } from 'lucide-react';
import { Modal } from '../components/Modal';
import { EmptyState, LoadingState, PageHeader, StatCard, StatusPill } from '../components/ui';
import { formatINR } from '../utils/clinical';
import { cn } from '../lib/cn';

const BED_TONE: Record<string, string> = {
  AVAILABLE: 'border-emerald-500/40 bg-emerald-500/[0.08] hover:bg-emerald-500/15',
  OCCUPIED: 'border-sky-500/40 bg-sky-500/[0.08] hover:bg-sky-500/15',
  OCCUPIED_ICU: 'border-red-500/40 bg-red-500/[0.08] hover:bg-red-500/15',
  MAINTENANCE: 'border-amber-500/40 bg-amber-500/[0.08]',
  CLEANING: 'border-slate-400/40 bg-slate-500/[0.08]',
};

export const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'room' | 'bed'; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [roomData, setRoomData] = useState({ name: '', type: 'Ward', capacity: 1, basePrice: 50 });
  const [bedData, setBedData] = useState({ roomId: '', bedNumber: '', pricePerDay: 50 });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/rooms'), api.get('/beds')])
      .then(([roomsRes, bedsRes]) => {
        setRooms(roomsRes || []);
        setBeds(bedsRes || []);
        if (roomsRes?.length && !bedData.roomId) {
          setBedData((prev) => ({ ...prev, roomId: roomsRes[0].id }));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/${deleteTarget.type}s/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...roomData, capacity: Number(roomData.capacity), basePrice: Number(roomData.basePrice) };
      if (editingRoom) {
        await api.patch(`/rooms/${editingRoom.id}`, payload);
      } else {
        await api.post('/rooms', payload);
      }
      setIsRoomModalOpen(false);
      setEditingRoom(null);
      setRoomData({ name: '', type: 'Ward', capacity: 1, basePrice: 50 });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBedStatusUpdate = async (bedId: string, status: string) => {
    try {
      await api.patch(`/beds/${bedId}/status`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/beds', { ...bedData, pricePerDay: Number(bedData.pricePerDay) });
      setIsBedModalOpen(false);
      setBedData((prev) => ({ ...prev, bedNumber: '', pricePerDay: 50 }));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const stats = useMemo(() => {
    const available = beds.filter((b) => b.status === 'AVAILABLE').length;
    const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
    const other = beds.length - available - occupied;
    const rate = beds.length ? Math.round((occupied / beds.length) * 100) : 0;
    return { available, occupied, other, rate, total: beds.length };
  }, [beds]);

  const boardRooms = useMemo(() => {
    return rooms
      .filter((r) => typeFilter === 'ALL' || r.type === typeFilter)
      .map((room) => {
        const roomBeds = beds
          .filter((b) => b.roomId === room.id || b.room?.id === room.id)
          .filter((b) => statusFilter === 'ALL' || b.status === statusFilter);
        // Also include beds nested on room if API returns them
        const nested = (room.beds || []).filter((b: any) => statusFilter === 'ALL' || b.status === statusFilter);
        const merged = roomBeds.length ? roomBeds : nested;
        return { ...room, boardBeds: merged };
      })
      .filter((r) => statusFilter === 'ALL' || r.boardBeds.length > 0 || typeFilter !== 'ALL');
  }, [rooms, beds, statusFilter, typeFilter]);

  if (loading) return <LoadingState label="Loading bed board…" />;

  return (
    <div className="space-y-5 pb-10 animate-fade-in-up">
      <PageHeader
        title="Bed Board"
        subtitle="Live ward occupancy — green free, blue occupied, amber maintenance."
        icon={<Bed className="h-5 w-5" />}
        meta={
          <>
            <StatusPill tone="success">{stats.available} free</StatusPill>
            <StatusPill tone="info">{stats.occupied} occupied</StatusPill>
            <StatusPill tone="warning">{stats.rate}% full</StatusPill>
          </>
        }
        actions={
          <>
            <button onClick={() => { setEditingRoom(null); setRoomData({ name: '', type: 'Ward', capacity: 1, basePrice: 50 }); setIsRoomModalOpen(true); }} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]">
              <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Room</span>
            </button>
            <button onClick={() => setIsBedModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Bed
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total beds" value={stats.total} sub="Across all wards" icon={<Bed className="h-5 w-5" />} accent="#2563eb" />
        <StatCard label="Available" value={stats.available} sub="Ready for admit" icon={<Bed className="h-5 w-5" />} accent="#10b981" />
        <StatCard label="Occupied" value={stats.occupied} sub="Active inpatients" icon={<Bed className="h-5 w-5" />} accent="#0ea5e9" urgent={stats.rate > 85} />
        <StatCard label="Occupancy" value={`${stats.rate}%`} sub="Hospital-wide" icon={<Bed className="h-5 w-5" />} accent="#f59e0b" />
      </div>

      {/* Legend + filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--text-muted)]">
          {[
            { c: 'bg-emerald-500', l: 'Available' },
            { c: 'bg-sky-500', l: 'Occupied' },
            { c: 'bg-amber-500', l: 'Maintenance' },
            { c: 'bg-slate-400', l: 'Cleaning' },
          ].map((x) => (
            <span key={x.l} className="inline-flex items-center gap-1.5"><span className={cn('h-2.5 w-2.5 rounded-sm', x.c)} />{x.l}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm font-semibold">
            <option value="ALL">All types</option>
            {['Ward', 'ICU', 'Private', 'Semi-Private'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-1">
            {['ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors',
                  statusFilter === s ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
                )}
              >
                {s === 'ALL' ? 'All' : s.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      {boardRooms.length === 0 ? (
        <EmptyState
          icon={<Bed className="h-6 w-6" />}
          title="No rooms configured"
          description="Add a room, then add beds to build your live ward board."
          action={
            <button onClick={() => setIsRoomModalOpen(true)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
              Add first room
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {boardRooms.map((room) => {
            const occ = room.boardBeds.filter((b: any) => b.status === 'OCCUPIED').length;
            const cap = room.boardBeds.length || room.capacity || 0;
            return (
              <div key={room.id} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] bg-[var(--inner-bg)] px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400">
                      <Bed className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-[var(--text-primary)]">{room.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {room.type} · {formatINR(room.basePrice)}/day base · {occ}/{cap} occupied
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={occ / Math.max(cap, 1) > 0.85 ? 'danger' : 'info'}>
                      {cap ? Math.round((occ / cap) * 100) : 0}% full
                    </StatusPill>
                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setRoomData({ name: room.name, type: room.type, capacity: room.capacity || 1, basePrice: room.basePrice || 50 });
                        setIsRoomModalOpen(true);
                      }}
                      className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-blue-500/10 hover:text-blue-600"
                      title="Edit room"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: room.id, type: 'room', name: room.name })}
                      className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {room.boardBeds.length === 0 ? (
                    <p className="py-6 text-center text-sm text-[var(--text-muted)]">No beds in this room yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                      {room.boardBeds.map((bed: any) => (
                        <div
                          key={bed.id}
                          className={cn(
                            'group relative rounded-xl border-2 p-3 transition-all',
                            BED_TONE[bed.status] || BED_TONE.CLEANING
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-sm font-black text-[var(--text-primary)]">{bed.bedNumber}</p>
                            <button
                              onClick={() => setDeleteTarget({ id: bed.id, type: 'bed', name: bed.bedNumber })}
                              className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-[var(--text-muted)] hover:text-rose-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <StatusPill status={bed.status} className="mt-2 !text-[9px] !px-1.5 !py-0" />
                          
                          {bed.status === 'CLEANING' && (
                            <button
                              onClick={() => handleBedStatusUpdate(bed.id, 'AVAILABLE')}
                              className="mt-2.5 w-full rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
                            >
                              Mark Available
                            </button>
                          )}

                          {bed.status === 'MAINTENANCE' && (
                            <button
                              onClick={() => handleBedStatusUpdate(bed.id, 'AVAILABLE')}
                              className="mt-2.5 w-full rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
                            >
                              Finish Maintenance
                            </button>
                          )}

                          <p className="mt-2 text-[10px] font-semibold text-[var(--text-muted)]">
                            {formatINR(bed.pricePerDay)}/day
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isRoomModalOpen} onClose={() => { setIsRoomModalOpen(false); setEditingRoom(null); }} title={editingRoom ? 'Edit room' : 'Add room'}>
        <form onSubmit={handleRoomSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Room name</label>
            <input required value={roomData.name} onChange={(e) => setRoomData({ ...roomData, name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="e.g. Ward B" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select value={roomData.type} onChange={(e) => setRoomData({ ...roomData, type: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2">
              {['Ward', 'ICU', 'Private', 'Semi-Private'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Capacity</label>
              <input required type="number" value={roomData.capacity} onChange={(e) => setRoomData({ ...roomData, capacity: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Base price (₹)</label>
              <input required type="number" value={roomData.basePrice} onChange={(e) => setRoomData({ ...roomData, basePrice: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setIsRoomModalOpen(false); setEditingRoom(null); }} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium">Cancel</button>
            <button type="submit" className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">{editingRoom ? 'Save changes' : 'Save room'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBedModalOpen} onClose={() => setIsBedModalOpen(false)} title="Add bed">
        <form onSubmit={handleBedSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Room</label>
            <select required value={bedData.roomId} onChange={(e) => setBedData({ ...bedData, roomId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2">
              <option value="">Select room</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Bed number</label>
            <input required value={bedData.bedNumber} onChange={(e) => setBedData({ ...bedData, bedNumber: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="B-101" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Price / day (₹)</label>
            <input required type="number" value={bedData.pricePerDay} onChange={(e) => setBedData({ ...bedData, pricePerDay: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsBedModalOpen(false)} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium">Cancel</button>
            <button type="submit" className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Save bed</button>
          </div>
        </form>
      </Modal>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">Delete {deleteTarget.type}</h3>
                <p className="text-sm text-slate-500">This cannot be undone.</p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="ml-auto text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-5 text-sm">Delete <strong>{deleteTarget.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
