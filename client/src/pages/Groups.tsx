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
          <h2 className="text-2xl font-extrabold text-slate-900">Staff Groups</h2>
          <p className="text-sm text-slate-400">Organize teams, departments, and shift groups</p>
        </div>
        <button onClick={() => setShowGroupForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm">
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {groups.map((group: any) => (
          <div key={group.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden group/card hover:shadow-lg transition-all">
            <div className="h-1.5" style={{ backgroundColor: group.color }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: group.color + '15' }}>
                    <UsersRound className="w-5 h-5" style={{ color: group.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{group.name}</h4>
                    <p className="text-[10px] text-slate-400">{group.members?.length || 0} members</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button onClick={() => setShowMemberForm(group.id)} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><UserPlus className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {group.description && <p className="text-xs text-slate-500 mb-4">{group.description}</p>}
              {/* Members */}
              <div className="space-y-2">
                {(group.members || []).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl group/member">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-slate-100">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{m.memberName}</p>
                        <p className="text-[10px] text-slate-400">{m.role}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveMember(m.id)} className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/member:opacity-100 transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {(!group.members || group.members.length === 0) && (
                  <p className="text-[10px] text-slate-300 text-center py-3 italic">No members yet</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="col-span-full text-center py-16">
            <UsersRound className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No groups created yet</p>
            <p className="text-xs text-slate-300 mt-1">Create your first team or department group</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGroupForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Create Group</h3>
              <button onClick={() => setShowGroupForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-semibold text-slate-700 block mb-1">Group Name</label><input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="e.g., Night Shift ICU" /></div>
              <div><label className="text-sm font-semibold text-slate-700 block mb-1">Description</label><input value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Optional description" /></div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Color</label>
                <div className="flex gap-2">{PRESET_COLORS.map(c => (<button key={c} onClick={() => setGroupForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-xl transition-all ${groupForm.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />))}</div>
              </div>
              <button onClick={handleCreateGroup} disabled={!groupForm.name} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Create Group</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMemberForm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Add Member</h3>
              <button onClick={() => setShowMemberForm(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-semibold text-slate-700 block mb-1">Name</label><input value={memberForm.memberName} onChange={e => setMemberForm(f => ({ ...f, memberName: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
              <div><label className="text-sm font-semibold text-slate-700 block mb-1">Role</label><select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"><option>Doctor</option><option>Nurse</option><option>Technician</option><option>Admin</option><option>Specialist</option></select></div>
              <button onClick={handleAddMember} disabled={!memberForm.memberName} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
