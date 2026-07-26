import { cn } from '../../lib/cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'clinical';

const TONE: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25',
  info: 'bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25',
  clinical: 'bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25',
};

const STATUS_MAP: Record<string, Tone> = {
  WAITING: 'warning',
  PENDING: 'warning',
  IN_CONSULTATION: 'info',
  COMPLETED: 'success',
  PAID: 'success',
  Paid: 'success',
  ACTIVE: 'success',
  Active: 'success',
  AVAILABLE: 'success',
  OCCUPIED: 'info',
  SKIPPED: 'danger',
  CANCELLED: 'danger',
  Cancelled: 'danger',
  MAINTENANCE: 'warning',
  CLEANING: 'neutral',
  ISSUED: 'info',
  DISPENSED: 'success',
  ORDERED: 'info',
  URGENT: 'danger',
  ROUTINE: 'neutral',
  'Out-Patient': 'info',
  'In-Patient': 'clinical',
  Admitted: 'clinical',
  Discharged: 'neutral',
  TRIAL: 'warning',
  EXPIRED: 'danger',
};

export function statusTone(status?: string | null): Tone {
  if (!status) return 'neutral';
  return STATUS_MAP[status] || 'neutral';
}

export function StatusPill({
  status,
  tone,
  pulse,
  className,
  children,
}: {
  status?: string | null;
  tone?: Tone;
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const resolved = tone || statusTone(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
        TONE[resolved],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children ?? status?.replace(/_/g, ' ')}
    </span>
  );
}
