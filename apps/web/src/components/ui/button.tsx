import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'lacquer';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-accent-500 text-paper-0 ' +
    'hover:bg-accent-600 active:bg-accent-700 ' +
    'disabled:bg-paper-200 disabled:text-ink-500 disabled:border disabled:border-paper-300 ' +
    'shadow-[var(--shadow-paper)]',
  secondary:
    'bg-paper-0 text-ink-800 ' +
    'border border-ink-200 ' +
    'hover:bg-paper-100 hover:border-ink-300 ' +
    'active:bg-paper-200 ' +
    'disabled:text-ink-400',
  ghost:
    'text-ink-700 ' +
    'hover:bg-paper-100 active:bg-paper-200 ' +
    'disabled:text-ink-400',
  danger:
    'bg-lacquer-500 text-paper-0 ' +
    'hover:bg-lacquer-700 disabled:opacity-50 ' +
    'shadow-[var(--shadow-paper)]',
  lacquer:
    'bg-ink-900 text-paper-0 ' +
    'hover:bg-ink-800 shadow-[var(--shadow-paper)] ' +
    'disabled:bg-paper-200 disabled:text-ink-500 disabled:border disabled:border-paper-300',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-[13px] rounded-[5px]',
  md: 'h-10 px-4 text-sm rounded-[6px]',
  lg: 'h-12 px-6 text-base rounded-[7px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium tracking-[0.005em]',
        'transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
        'disabled:cursor-not-allowed disabled:shadow-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
