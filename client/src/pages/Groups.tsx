import { useState, useEffect } from 'react';
import { UsersRound, Plus, Trash2, X, UserPlus, User } from 'lucide-react';
import { api } from '../services/api';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export const Groups = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', color: '#3b82f6' });
  const [memberForm, setMemberForm] = useState({ memberName: '', role: 'Nurse' });

  useEffect(() => { loadGroups(); }, []);
  const loadGroups = () => api.get('/groups').then(setGroups).catch(() => {});

  const handleCreateGroup = async () => {
    try {
      await api.post('/groups', groupForm);
      setGroupForm({ name: '', description: '', color: '#3b82f6' });
      setShowGroupForm(false);
      loadGroups();
    } catch (e) { console.error(e); }
  };

  const handleDeleteGroup = async (id: string) => {
    try { await api.delete(`/groups/${id}`); loadGroups(); } catch (e) { console.error(e); }
  };

  const handleAddMember = async () => {
    if (!showMemberForm) return;
    try {
      await api.post('/groups/members', { groupId: showMemberForm, ...memberForm });
      setMemberForm({ memberName: '', role: 'Nurse' });
      setShowMemberForm(null);
      loadGroups();
    } catch (e) { console.error(e); }
  };

  const handleRemoveMember = async (id: string) => {
    try { await api.delete(`/groups/members/${id}`); loadGroups(); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">Staff Groups</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-1">Organize teams, departments, and shift groups</p>
        </div>
        <button onClick={() => setShowGroupForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/10 transition-all text-sm cursor-pointer active:scale-95 shadow-sm">
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {groups.map((group: any) => (
          <div key={group.id} className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 overflow-hidden group/card hover:shadow-md transition-all duration-300">
            <div className="h-1.5" style={{ backgroundColor: group.color }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: group.color + '15' }}>
                    <UsersRound className="w-5 h-5" style={{ color: group.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-150">{group.name}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">{group.members?.length || 0} members</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button onClick={() => setShowMemberForm(group.id)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"><UserPlus className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {group.description && <p className="text-xs text-slate-500 dark:text-zinc-450 mb-4">{group.description}</p>}
              {/* Members */}
              <div className="space-y-2">
                {(group.members || []).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-zinc-900/40 rounded-xl group/member border border-transparent hover:border-slate-200/30 dark:hover:border-zinc-800/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-white dark:bg-zinc-950 rounded-lg flex items-center justify-center border border-slate-100 dark:border-zinc-800/60 shadow-sm">
                        <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-805 dark:text-zinc-200 leading-none">{m.memberName}</p>
                        <p className="text-[9px] text-slate-450 dark:text-zinc-500 font-bold block mt-0.5 leading-none">{m.role}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveMember(m.id)} className="p-1 text-slate-350 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover/member:opacity-100 transition-all cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {(!group.members || group.members.length === 0) && (
                  <p className="text-[10px] text-slate-400 dark:text-zinc-600 text-center py-3 italic">No members yet</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="col-span-full text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20">
            <UsersRound className="w-12 h-12 text-slate-350 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-zinc-450">No groups created yet</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Create your first team or department group</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGroupForm(false)}>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Create Group</h3>
              <button onClick={() => setShowGroupForm(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-400 dark:text-zinc-550 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">Group Name</label><input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-blue-500/25" placeholder="e.g., Night Shift ICU" /></div>
              <div><label className="text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">Description</label><input value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-blue-500/25" placeholder="Optional description" /></div>
              <div>
                <label className="text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-wider block mb-2">Color Tag</label>
                <div className="flex flex-wrap gap-2">{PRESET_COLORS.map(c => (<button key={c} onClick={() => setGroupForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-xl transition-all cursor-pointer ${groupForm.color === c ? 'ring-2 ring-offset-2 dark:ring-offset-zinc-950 ring-slate-400 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />))}</div>
              </div>
              <button onClick={handleCreateGroup} disabled={!groupForm.name} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4">Create Group</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMemberForm(null)}>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Add Member</h3>
              <button onClick={() => setShowMemberForm(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-400 dark:text-zinc-550 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">Name</label><input value={memberForm.memberName} onChange={e => setMemberForm(f => ({ ...f, memberName: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25" /></div>
              <div><label className="text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">Role</label><select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none cursor-pointer"><option>Doctor</option><option>Nurse</option><option>Technician</option><option>Admin</option><option>Specialist</option></select></div>
              <button onClick={handleAddMember} disabled={!memberForm.memberName} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4">Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
