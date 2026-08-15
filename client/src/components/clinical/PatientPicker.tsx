import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../services/api';

export interface PickedPatient {
  id: string;
  name: string;
  sixDigitId?: string;
  contact?: string;
}

export const PatientPicker = ({
  value,
  onChange,
  patients: provided,
  label = 'Patient',
  required = true,
}: {
  value: string;
  onChange: (patient: PickedPatient | null) => void;
  patients?: PickedPatient[];
  label?: string;
  required?: boolean;
}) => {
  const [list, setList] = useState<PickedPatient[]>(provided || []);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (provided) {
      setList(provided);
      return;
    }
    api.get('/patients').then((res) => setList(Array.isArray(res) ? res : [])).catch(() => []);
  }, [provided]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 80);
    return list.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.sixDigitId?.includes(q) ||
      p.contact?.includes(q)
    ).slice(0, 80);
  }, [list, query]);

  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or HOSCORE ID"
          className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pl-9 pr-3 text-xs font-semibold text-[var(--text-primary)]"
        />
      </div>
      <select
        required={required}
        value={value}
        onChange={(e) => {
          const next = list.find((p) => p.id === e.target.value) || null;
          onChange(next);
        }}
        className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
      >
        <option value="">Select patient…</option>
        {filtered.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}{p.sixDigitId ? ` · ${p.sixDigitId}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
};
