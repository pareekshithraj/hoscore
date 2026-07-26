import { cn } from '../../lib/cn';

export function TokenBadge({
  token,
  size = 'md',
  className,
}: {
  token: number | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-sky-300 font-black tabular-nums leading-none',
        size === 'sm' && 'h-9 w-9 text-sm',
        size === 'md' && 'h-12 w-12 text-lg',
        size === 'lg' && 'h-16 w-16 text-2xl',
        className
      )}
    >
      <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-blue-500/70 dark:text-sky-400/70 mb-0.5">
        TKN
      </span>
      {token}
    </div>
  );
}
