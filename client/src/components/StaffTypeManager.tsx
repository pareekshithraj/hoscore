import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Save, ShieldCheck, Trash2, Users, ArrowUpRight, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ALL_FEATURES, FEATURE_LABELS } from '../utils/features';

interface AssignedStaffMember {
  membershipId: string;
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  department?: string;
  role: string;
}

interface StaffType {
  id: string;
  name: string;
  code: string;
  role: string;
  description?: string | null;
  permissions: string[];
  isPreset: boolean;
  hospitalId?: string | null;
  assignedStaff?: AssignedStaffMember[];
}

const roleOptions = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECH', 'STAFF', 'CLEANER'];

export const StaffTypeManager = ({ mode }: { mode: 'hospital' | 'superadmin' }) => {
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: 'Custom Staff Privilege',
    role: 'STAFF',
    description: '',
    permissions: ['dashboard', 'notices', 'leaves'],
  });

  const basePath = mode === 'superadmin' ? '/super-admin/staff-types' : '/staff-types';
  const title = mode === 'superadmin' ? 'Global Staff Privilege Presets' : 'Hospital Staff Privileges';
  const subtitle = mode === 'superadmin'
    ? 'Create presets that hospitals can select from when assigning staff access.'
    : 'Create staff privilege profiles and choose exactly which features each team can access.';

  const selected = useMemo(() => staffTypes.find((item) => item.id === selectedId), [staffTypes, selectedId]);

  const load = async () => {
    const data = await api.get(basePath);
    setStaffTypes(data);
    if (!selectedId && data.length) setSelectedId(data[0].id);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setForm({
      name: selected.name,
      role: selected.role,
      description: selected.description || '',
      permissions: selected.permissions || [],
    });
  }, [selected]);

  const toggleFeature = (feature: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(feature)
        ? prev.permissions.filter((item) => item !== feature)
        : [...prev.permissions, feature],
    }));
  };

  const startNewProfile = () => {
    setSelectedId('');
    setForm({
      name: '',
      role: 'STAFF',
      description: '',
      permissions: ['dashboard', 'notices', 'leaves'],
    });
    setStatus('Creating new privilege profile — fill in details below and click "Create Staff Privilege Profile"');
  };

  const createNew = async () => {
    if (!form.name.trim()) {
      setStatus('Please enter a Staff Type Name before creating');
      return;
    }
    try {
      setSaving(true);
      const created = await api.post(basePath, {
        name: form.name.trim(),
        role: form.role,
        description: form.description,
        permissions: form.permissions,
      });
      setStatus(`Staff privilege profile "${created.name}" created successfully!`);
      setSelectedId(created.id);
      await load();
    } catch (err: any) {
      setStatus(err?.message || 'Failed to create staff privilege profile');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(''), 4000);
    }
  };

  const save = async () => {
    if (!selectedId) {
      return createNew();
    }
    try {
      setSaving(true);
      await api.put(`${basePath}/${selectedId}`, form);
      setStatus('Staff privilege profile updated and applied to assigned staff');
      await load();
    } catch (err: any) {
      setStatus(err?.message || 'Failed to save staff privilege profile');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(''), 4000);
    }
  };

  const deactivate = async () => {
    if (!selected) return;
    if (!window.confirm(`Deactivate ${selected.name}? Existing staff keep their current permissions, but this privilege profile cannot be assigned to new staff.`)) return;
    try {
      await api.delete(`${basePath}/${selected.id}`);
      setStatus('Staff privilege profile deactivated');
      setSelectedId('');
      await load();
    } catch (err: any) {
      setStatus(err?.message || 'Failed to deactivate');
    } finally {
      setTimeout(() => setStatus(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={startNewProfile}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Privilege Profile
        </button>
      </div>

      {status && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-300">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Staff Types / Privilege List */}
        <div className="lg:col-span-4 bg-white dark:bg-[#070b16] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Privilege Profiles</span>
            <span className="text-xs font-bold text-slate-500">{staffTypes.length} profiles</span>
          </div>

          <button
            onClick={startNewProfile}
            className={`w-full text-left rounded-xl border border-dashed p-3.5 transition cursor-pointer flex items-center gap-3 ${
              selectedId === ''
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/10 text-blue-600 dark:text-sky-300'
                : 'border-slate-300 dark:border-white/20 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">+ New Profile Draft</div>
              <div className="text-[11px] text-slate-400 font-semibold">Click to clear form & define new type</div>
            </div>
          </button>

          {staffTypes.map((item) => {
            const count = item.assignedStaff?.length || 0;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left rounded-xl border p-4 transition cursor-pointer ${
                  selectedId === item.id
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
                    : 'border-slate-100 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {item.name}
                  </div>
                  {item.isPreset ? (
                    <span className="text-[10px] font-black text-blue-600 dark:text-sky-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                      PRESET
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
                      CUSTOM
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between font-semibold">
                  <span>{item.role} · {(item.permissions || []).length} features</span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-sky-400 font-bold">
                    <Users className="w-3 h-3" /> {count} staff
                  </span>
                </div>
                {item.description && <div className="text-xs text-slate-400 mt-2 line-clamp-2">{item.description}</div>}
              </button>
            );
          })}
        </div>

        {/* Right: Access Profile Configuration Form */}
        <div className="lg:col-span-8 bg-white dark:bg-[#070b16] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 dark:text-white">
                  {selectedId ? 'Access Profile Configuration' : 'Create New Staff Privilege Profile'}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedId
                    ? 'Edit role label, feature access rights, and view assigned staff.'
                    : 'Fill in the details below to create a new custom staff type with tailored access permissions.'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
              {selectedId ? (selected?.isPreset ? 'Editable Preset' : 'Custom Profile') : 'New Profile Draft'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Staff Type Name <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Senior Resident Doctor, Head Nurse, Front Desk Executive"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role Label</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe duties or scope of access for this staff type..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Feature Access Permissions</h3>
              <span className="text-xs text-blue-600 dark:text-sky-400 font-bold">{form.permissions.length} selected</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {ALL_FEATURES.map((feature) => {
                const checked = form.permissions.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition cursor-pointer ${
                      checked
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-white/20'}`}>
                      {checked && <Check className="w-3 h-3" />}
                    </span>
                    {FEATURE_LABELS[feature]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Staff Mapping Section */}
          {selectedId ? (
            <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Mapped Staff Members</h3>
                  <span className="text-xs font-bold text-slate-500">({selected?.assignedStaff?.length || 0} assigned)</span>
                </div>
                <Link
                  to="/dashboard/staff"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300 inline-flex items-center gap-1"
                >
                  Recruit / Assign Staff in Staff Page <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {selected?.assignedStaff && selected.assignedStaff.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {selected.assignedStaff.map((staff) => (
                    <div
                      key={staff.membershipId}
                      className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{staff.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{staff.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-md flex-shrink-0">
                        {staff.department || 'General'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/10 p-4 text-center">
                  <UserCheck className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500 font-semibold">No staff members currently mapped to this privilege profile.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Assign staff to this profile when adding or editing accounts on the <Link to="/dashboard/staff" className="text-blue-500 font-bold hover:underline">Staff Page</Link>.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            {selectedId ? (
              <button
                onClick={deactivate}
                disabled={!selected || saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Deactivate Profile
              </button>
            ) : (
              <button
                onClick={() => setSelectedId(staffTypes[0]?.id || '')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Cancel Draft
              </button>
            )}

            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {selectedId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Saving...' : selectedId ? 'Save Selected Staff Privilege' : 'Create Staff Privilege Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

