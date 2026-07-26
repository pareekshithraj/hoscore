import { cn } from '../../lib/cn';

export function StatCard({
  label,
  value,
  sub,
  icon,
  urgent,
  accent,
  className,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  urgent?: boolean;
  accent?: string;
  className?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-left shadow-sm transition-all',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent || '#2563eb'}14`, color: accent || '#2563eb' }}
          >
            {icon}
          </div>
        )}
        {urgent && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Alert
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight tabular-nums text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{label}</p>
      {sub && <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </Comp>
  );
}
