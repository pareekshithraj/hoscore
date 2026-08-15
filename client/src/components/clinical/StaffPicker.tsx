import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../services/api';

export interface PickedStaff {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  source?: string;
}

export const StaffPicker = ({
  value,
  onChange,
  label = 'Staff member',
  required = true,
}: {
  value: string;
  onChange: (staff: PickedStaff | null) => void;
  label?: string;
  required?: boolean;
}) => {
  const [list, setList] = useState<PickedStaff[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/roster')
      .then((res) => setList(Array.isArray(res) ? res : []))
      .catch(() => {
        api.get('/staff').then((res) => setList(Array.isArray(res) ? res : [])).catch(() => []);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 80);
    return list.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
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
          placeholder="Search name or role"
          className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pl-9 pr-3 text-xs font-semibold text-[var(--text-primary)]"
        />
      </div>
      <select
        required={required}
        value={value}
        onChange={(e) => {
          const next = list.find((s) => s.id === e.target.value) || null;
          onChange(next);
        }}
        className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
      >
        <option value="">Select staff…</option>
        {filtered.map((s) => (
          <option key={`${s.source}-${s.id}`} value={s.id}>
            {s.name} · {s.role}
          </option>
        ))}
      </select>
    </label>
  );
};
