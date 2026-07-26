import { cn } from '../../lib/cn';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--inner-bg)]',
        compact ? 'px-4 py-10' : 'px-6 py-16',
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)]">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--text-muted)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
