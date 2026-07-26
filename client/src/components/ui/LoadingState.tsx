import { cn } from '../../lib/cn';

export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-[240px] flex-col items-center justify-center gap-3', className)}>
      <div className="h-9 w-9 rounded-full border-[3px] border-slate-200 border-t-blue-600 dark:border-zinc-800 dark:border-t-sky-400 animate-spin" />
      <p className="text-sm font-semibold text-[var(--text-muted)] animate-pulse">{label}</p>
    </div>
  );
}
