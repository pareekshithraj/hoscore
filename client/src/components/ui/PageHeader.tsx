import { cn } from '../../lib/cn';

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  meta,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6 shadow-sm',
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.06),transparent_55%)]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5 min-w-0">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/15 bg-blue-500/10 text-blue-600 dark:text-sky-400">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)] truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[var(--text-secondary)] leading-relaxed">{subtitle}</p>
            )}
            {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
