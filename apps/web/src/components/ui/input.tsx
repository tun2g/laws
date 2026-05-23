import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

const fieldBase =
  'block w-full bg-[var(--color-paper-0)] px-3.5 py-2.5 text-[14px] ' +
  'border border-[var(--color-paper-300)] rounded-[5px] ' +
  'text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-400)] ' +
  'shadow-[inset_0_1px_0_rgba(20,18,14,0.02)] ' +
  'transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'focus:border-[var(--color-accent-500)] focus:outline-none ' +
  'focus:ring-[3px] focus:ring-[var(--color-accent-500)]/15';

const fieldError = 'border-[var(--color-lacquer-500)] focus:ring-[var(--color-lacquer-500)]/15';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-[12px] font-medium tracking-[0.005em] text-[var(--color-ink-700)]"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        ref={ref}
        className={cn(fieldBase, error && fieldError, className)}
        {...rest}
      />
      {error ? (
        <p className="text-[11.5px] text-[var(--color-lacquer-500)]">{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] text-[var(--color-ink-500)]">{hint}</p>
      ) : null}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, hint, error, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-[12px] font-medium tracking-[0.005em] text-[var(--color-ink-700)]"
        >
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        ref={ref}
        className={cn(
          fieldBase,
          'min-h-[120px] leading-relaxed resize-y',
          error && fieldError,
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="text-[11.5px] text-[var(--color-lacquer-500)]">{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] text-[var(--color-ink-500)]">{hint}</p>
      ) : null}
    </div>
  );
});
