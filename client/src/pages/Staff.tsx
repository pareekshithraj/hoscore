import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import { Plus, Search, User, Moon, Sun, Coffee, Edit2, Trash2, Check, Save, QrCode } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StaffQRBadgeModal } from '../components/StaffQRBadgeModal';
import { ALL_FEATURES, FEATURE_LABELS } from '../utils/features';

const roleColors: Record<string, string> = {
  NURSE: 'bg-pink-100 text-pink-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  PHARMACIST: 'bg-purple-100 text-purple-800',
  RECEPTIONIST: 'bg-teal-100 text-teal-800',
};

const shiftIcons: Record<string, ReactNode> = {
  Morning: <Sun className="w-3.5 h-3.5 text-amber-500" />,
  Evening: <Coffee className="w-3.5 h-3.5 text-orange-500" />,
  Night: <Moon className="w-3.5 h-3.5 text-indigo-500" />,
};

const roles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECH', 'STAFF', 'CLEANER'];
const departments = ['Cardiology', 'ICU', 'Surgery', 'Pharmacy', 'Administration', 'Front Desk'];
const shifts = ['Morning', 'Evening', 'Night'];

export const Staff = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [staffTypes, setStaffTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', role: 'NURSE', department: 'General', shift: 'Morning', contact: '', email: ''
  });
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: 'changeme123',
    department: 'General',
    staffTypeId: '',
  });
  const [editingMembershipId, setEditingMembershipId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedShift, setSelectedShift] = useState('All Shifts');
  const [selectedBadgeStaff, setSelectedBadgeStaff] = useState<any | null>(null);
  const [membershipForm, setMembershipForm] = useState({
    role: 'STAFF',
    department: 'General',
    staffTypeId: '',
    permissions: [] as string[],
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchStaff = () => {
    setLoading(true);
    api.get('/staff')
      .then(res => setStaff(res))
      .finally(() => setLoading(false));
    api.get('/hospitals/staff').then(setMemberships).catch(() => {});
    api.get('/staff-types').then((res) => {
      setStaffTypes(res);
      if (res.length) setAccountData((prev) => ({ ...prev, staffTypeId: res[0].id }));
    }).catch(() => {});
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.delete(`/staff/${confirmDeleteId}`);
      setConfirmDeleteId(null);
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/staff', formData);
      setIsModalOpen(false);
      setFormData({ name: '', role: 'NURSE', department: 'General', shift: 'Morning', contact: '', email: '' });
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedType = staffTypes.find((type) => type.id === accountData.staffTypeId);
    try {
      await api.post('/hospitals/invite', {
        name: accountData.name,
        email: accountData.email,
        password: accountData.password,
        department: accountData.department,
        staffTypeId: accountData.staffTypeId,
        role: selectedType?.role || 'STAFF',
      });
      setAccountData({ name: '', email: '', password: 'changeme123', department: 'General', staffTypeId: staffTypes[0]?.id || '' });
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditMembership = (membership: any) => {
    setEditingMembershipId(membership.id);
    setMembershipForm({
      role: membership.role || 'STAFF',
      department: membership.department || 'General',
      staffTypeId: membership.staffTypeId || '',
      permissions: membership.permissions || [],
    });
  };

  const toggleMembershipFeature = (feature: string) => {
    setMembershipForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(feature)
        ? prev.permissions.filter((item) => item !== feature)
        : [...prev.permissions, feature],
    }));
  };

  const saveMembership = async () => {
    if (!editingMembershipId) return;
    await api.patch(`/hospitals/staff/${editingMembershipId}`, membershipForm);
    setEditingMembershipId('');
    fetchStaff();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
        <div className="animate-pulse">Loading staff records...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Staff Management</h2>
          <p className="text-slate-500">Manage nurses, admin, and support staff schedules.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: staff.length, color: 'text-slate-900' },
          { label: 'On Duty', value: staff.filter(s => s.status === 'On Duty').length, color: 'text-emerald-600' },
          { label: 'Morning Shift', value: staff.filter(s => s.shift === 'Morning').length, color: 'text-amber-600' },
          { label: 'Night Shift', value: staff.filter(s => s.shift === 'Night').length, color: 'text-indigo-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm transition-all duration-300">
            <p className="text-xs font-bold uppercase text-slate-400 dark:text-zinc-500 tracking-wider mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color} dark:text-zinc-200`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-150">Create Portal Login</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-450 mt-1">Assign a staff type preset or custom feature set to the new staff account.</p>
          </div>
          <span className="text-xs font-bold text-blue-700 dark:text-sky-400 bg-blue-50 dark:bg-sky-500/10 border border-blue-100/30 dark:border-blue-900/20 px-3 py-1.5 rounded-full">{memberships.length} login accounts</span>
        </div>
        <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input required value={accountData.name} onChange={e => setAccountData({...accountData, name: e.target.value})} placeholder="Staff name" className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/85 rounded-lg text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
          <input required type="email" value={accountData.email} onChange={e => setAccountData({...accountData, email: e.target.value})} placeholder="login@email.com" className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/85 rounded-lg text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
          <input required value={accountData.password} onChange={e => setAccountData({...accountData, password: e.target.value})} placeholder="Temp password" className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/85 rounded-lg text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
          <select value={accountData.staffTypeId} onChange={e => setAccountData({...accountData, staffTypeId: e.target.value})} className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/85 rounded-lg text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
            {staffTypes.map(type => <option key={type.id} value={type.id}>{type.name} ({type.role})</option>)}
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer">Create Login</button>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-150">Portal Access Accounts</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-450 mt-1">Fine tune a staff member's portal role, staff type, and feature access.</p>
          </div>
        </div>
        <div className="space-y-3">
          {memberships.map((membership) => {
            const isEditing = editingMembershipId === membership.id;
            const permissionCount = (membership.permissions || []).length;
            return (
              <div key={membership.id} className="rounded-xl border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/10 dark:bg-zinc-900/10 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-zinc-150">{membership.user?.name || membership.user?.email}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-450 mt-0.5">{membership.user?.email} - {membership.staffType?.name || 'Custom permissions'} - {permissionCount} features</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBadgeStaff(membership)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Staff Badge
                    </button>
                    <button onClick={() => startEditMembership(membership)} className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Access
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select value={membershipForm.role} onChange={e => setMembershipForm({...membershipForm, role: e.target.value})} className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/85 rounded-lg text-sm text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                        {roles.map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                      <input value={membershipForm.department} onChange={e => setMembershipForm({...membershipForm, department: e.target.value})} placeholder="Department" className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/85 rounded-lg text-sm text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
                      <select
                        value={membershipForm.staffTypeId}
                        onChange={e => {
                          const selectedType = staffTypes.find(type => type.id === e.target.value);
                          setMembershipForm({
                            ...membershipForm,
                            staffTypeId: e.target.value,
                            role: selectedType?.role || membershipForm.role,
                            permissions: selectedType?.permissions || membershipForm.permissions,
                          });
                        }}
                        className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/85 rounded-lg text-sm text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                      >
                        <option value="">Custom permissions</option>
                        {staffTypes.map(type => <option key={type.id} value={type.id}>{type.name} ({type.role})</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                      {ALL_FEATURES.map((feature) => {
                        const checked = membershipForm.permissions.includes(feature);
                        return (
                          <button
                            key={feature}
                            type="button"
                            onClick={() => toggleMembershipFeature(feature)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition-all cursor-pointer ${
                              checked 
                                ? 'border-blue-500 bg-blue-50 dark:bg-sky-500/10 text-blue-700 dark:text-sky-400' 
                                : 'border-slate-200 dark:border-zinc-800/70 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900/70'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-350 dark:border-zinc-700'}`}>
                              {checked && <Check className="w-3 h-3" />}
                            </span>
                            {FEATURE_LABELS[feature]}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingMembershipId('')} className="px-4 py-2 border border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-sm font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">Cancel</button>
                      <button onClick={saveMembership} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer">
                        <Save className="w-4 h-4" />
                        Save Access
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search staff..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all font-semibold" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-zinc-150 cursor-pointer focus:outline-none"
          value={selectedShift}
          onChange={e => setSelectedShift(e.target.value)}
        >
          <option value="All Shifts">All Shifts</option>
          {shifts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select 
          className="bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-zinc-150 cursor-pointer focus:outline-none"
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
        >
          <option value="All Roles">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-zinc-900/40 border-b border-slate-200/60 dark:border-zinc-800/80">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Staff Member</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Shift</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {(() => {
              const filteredStaff = staff.filter((member) => {
                const matchesSearch = 
                  member.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  member.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  member.department?.toLowerCase().includes(searchQuery.toLowerCase());
                  
                const matchesRole = 
                  selectedRole === 'All Roles' || 
                  member.role === selectedRole;
                  
                const matchesShift = 
                  selectedShift === 'All Shifts' || 
                  member.shift === selectedShift;

                return matchesSearch && matchesRole && matchesShift;
              });
              return filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center border border-slate-200/30 dark:border-zinc-800/40">
                      <User className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-zinc-150">{member.name}</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[member.role] || 'bg-slate-100 text-slate-700'}`}>
                    {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-zinc-300">{member.department}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-zinc-300 font-medium">
                    {shiftIcons[member.shift]}
                    {member.shift}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    member.status === 'On Duty' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/25' 
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'On Duty' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-zinc-900 rounded-md transition-colors cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(member.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-900 rounded-md transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ));
          })()}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Staff Member">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="Full name" className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                {roles.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Department</label>
              <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Shift</label>
              <select value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                {shifts.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Contact</label>
              <input required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} type="text" placeholder="+1 234 567 890" className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Email</label>
              <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="staff@hospital.com" className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-sm font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer">Add Staff</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Delete Staff Member">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-zinc-400">Are you sure you want to delete this staff member? This action is permanent.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 border border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-sm font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-95 cursor-pointer">Delete</button>
          </div>
        </div>
      </Modal>

      <StaffQRBadgeModal
        isOpen={!!selectedBadgeStaff}
        onClose={() => setSelectedBadgeStaff(null)}
        staffName={selectedBadgeStaff?.user?.name || selectedBadgeStaff?.user?.email || 'Staff Member'}
        roleOrSpecialty={selectedBadgeStaff?.staffType?.name || selectedBadgeStaff?.role || 'Clinical Staff'}
        staffId={selectedBadgeStaff?.id || 'STF-MAIN'}
      />
    </div>
  );
};
