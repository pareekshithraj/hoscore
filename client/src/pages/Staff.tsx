import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import { Plus, Search, User, Moon, Sun, Coffee, Edit2, Trash2, Check, Save } from 'lucide-react';
import { Modal } from '../components/Modal';
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
  const [membershipForm, setMembershipForm] = useState({
    role: 'STAFF',
    department: 'General',
    staffTypeId: '',
    permissions: [] as string[],
  });

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
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
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create Portal Login</h3>
            <p className="text-sm text-slate-500">Assign a staff type preset or custom feature set to the new staff account.</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">{memberships.length} login accounts</span>
        </div>
        <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input required value={accountData.name} onChange={e => setAccountData({...accountData, name: e.target.value})} placeholder="Staff name" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input required type="email" value={accountData.email} onChange={e => setAccountData({...accountData, email: e.target.value})} placeholder="login@email.com" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input required value={accountData.password} onChange={e => setAccountData({...accountData, password: e.target.value})} placeholder="Temp password" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={accountData.staffTypeId} onChange={e => setAccountData({...accountData, staffTypeId: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {staffTypes.map(type => <option key={type.id} value={type.id}>{type.name} ({type.role})</option>)}
          </select>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black">Create Login</button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Portal Access Accounts</h3>
            <p className="text-sm text-slate-500">Fine tune a staff member's portal role, staff type, and feature access.</p>
          </div>
        </div>
        <div className="space-y-3">
          {memberships.map((membership) => {
            const isEditing = editingMembershipId === membership.id;
            const permissionCount = (membership.permissions || []).length;
            return (
              <div key={membership.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{membership.user?.name || membership.user?.email}</p>
                    <p className="text-xs text-slate-500">{membership.user?.email} - {membership.staffType?.name || 'Custom permissions'} - {permissionCount} features</p>
                  </div>
                  <button onClick={() => startEditMembership(membership)} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold hover:bg-slate-50">
                    <Edit2 className="w-4 h-4" />
                    Edit Access
                  </button>
                </div>
                {isEditing && (
                  <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select value={membershipForm.role} onChange={e => setMembershipForm({...membershipForm, role: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {roles.map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                      <input value={membershipForm.department} onChange={e => setMembershipForm({...membershipForm, department: e.target.value})} placeholder="Department" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${
                              checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                              {checked && <Check className="w-3 h-3" />}
                            </span>
                            {FEATURE_LABELS[feature]}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingMembershipId('')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                      <button onClick={saveMembership} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black">
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search staff..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none">
          <option>All Shifts</option>
          {shifts.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none">
          <option>All Roles</option>
          {roles.map(r => <option key={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Member</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shift</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[member.role] || 'bg-slate-100 text-slate-700'}`}>
                    {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{member.department}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                    {shiftIcons[member.shift]}
                    {member.shift}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === 'On Duty' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'On Duty' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(member.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Staff Member">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="Full name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {roles.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
              <select value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {shifts.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact</label>
              <input required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} type="text" placeholder="+1 234 567 890" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="staff@hospital.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Staff</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
