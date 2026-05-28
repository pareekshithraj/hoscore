import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { ALL_FEATURES, FEATURE_LABELS } from '../utils/features';

interface StaffType {
  id: string;
  name: string;
  code: string;
  role: string;
  description?: string | null;
  permissions: string[];
  isPreset: boolean;
  hospitalId?: string | null;
}

const roleOptions = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECH', 'STAFF', 'CLEANER'];

export const StaffTypeManager = ({ mode }: { mode: 'hospital' | 'superadmin' }) => {
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    name: 'Custom Staff Type',
    role: 'STAFF',
    description: '',
    permissions: ['dashboard', 'notices', 'leaves'],
  });

  const basePath = mode === 'superadmin' ? '/super-admin/staff-types' : '/staff-types';
  const title = mode === 'superadmin' ? 'Global Staff Type Presets' : 'Hospital Staff Types';
  const subtitle = mode === 'superadmin'
    ? 'Create presets that hospitals can select from when assigning staff access.'
    : 'Create local staff types and choose exactly which features each team can access.';

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

  const createNew = async () => {
    const created = await api.post(basePath, {
      name: form.name,
      role: form.role,
      description: form.description,
      permissions: form.permissions,
    });
    setStatus('Staff type created');
    setSelectedId(created.id);
    await load();
  };

  const save = async () => {
    if (!selected) return;
    await api.put(`${basePath}/${selected.id}`, form);
    setStatus('Staff type saved');
    await load();
  };

  const deactivate = async () => {
    if (!selected || !canEditSelected) return;
    if (!window.confirm(`Deactivate ${selected.name}? Existing staff keep their current permissions, but this type cannot be assigned again.`)) return;
    await api.delete(`${basePath}/${selected.id}`);
    setStatus('Staff type deactivated');
    setSelectedId('');
    await load();
  };

  const canEditSelected = mode === 'superadmin' || Boolean(selected?.hospitalId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={createNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create From Current Form
        </button>
      </div>

      {status && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{status}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white dark:bg-[#070b16] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 space-y-2">
          {staffTypes.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full text-left rounded-xl border p-4 transition ${
                selectedId === item.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                  : 'border-slate-100 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-black text-slate-900 dark:text-white">{item.name}</div>
                {item.isPreset && <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-2 py-1 rounded-full">PRESET</span>}
              </div>
              <div className="text-xs text-slate-500 mt-1">{item.role} · {(item.permissions || []).length} features</div>
              {item.description && <div className="text-xs text-slate-400 mt-2 line-clamp-2">{item.description}</div>}
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-[#070b16] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white">Access Profile</h2>
              <p className="text-xs text-slate-500">Choose a role label and feature set.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Staff Type Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!canEditSelected && Boolean(selected)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role Label</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={!canEditSelected && Boolean(selected)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
              >
                {roleOptions.map((role) => <option key={role}>{role}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={!canEditSelected && Boolean(selected)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Feature Access</h3>
              <span className="text-xs text-slate-500 font-bold">{form.permissions.length} selected</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {ALL_FEATURES.map((feature) => {
                const checked = form.permissions.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    disabled={!canEditSelected && Boolean(selected)}
                    onClick={() => toggleFeature(feature)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition disabled:opacity-60 ${
                      checked
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
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
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={deactivate}
              disabled={!selected || !canEditSelected}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-red-200 text-red-700 text-sm font-bold hover:bg-red-50 transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Deactivate Selected
            </button>
            <button
              onClick={save}
              disabled={!selected || !canEditSelected}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Selected Staff Type
            </button>
          </div>
          {!canEditSelected && selected && (
            <p className="text-xs text-slate-500 font-semibold">
              Global presets are read-only here. Create a custom hospital staff type from the current form to edit it locally.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
