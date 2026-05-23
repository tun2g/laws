import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(252,247,238,0.98))] border border-[rgba(188,174,139,0.55)]',
        'rounded-[var(--radius-card)]',
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  description,
  actions,
  overline,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  overline?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-[rgba(188,174,139,0.45)] px-6 py-5',
        className,
      )}
    >
      <div className="min-w-0">
        {overline ? <div className="overline mb-1.5">{overline}</div> : null}
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink-900)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--color-ink-500)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-5', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-[rgba(188,174,139,0.45)] bg-[rgba(241,233,215,0.55)] px-6 py-3.5',
        className,
      )}
      {...rest}
    />
  );
}
