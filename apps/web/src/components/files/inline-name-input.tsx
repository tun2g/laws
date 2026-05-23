'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  initial: string;
  placeholder?: string;
  /** Select extension off in initial selection (true for rename of files with ext). */
  selectName?: boolean;
  onCommit: (next: string) => void;
  onCancel: () => void;
}

/**
 * In-place editable input used for rename + create new file/folder in the
 * tree. Behaves like VS Code: focuses + selects the basename on mount,
 * Enter commits (if non-empty + changed), Esc cancels, blur commits.
 */
export function InlineNameInput({
  initial,
  placeholder,
  selectName = false,
  onCommit,
  onCancel,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const committed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    // Select just the basename (everything before the final dot) when
    // editing a filename. For new entries with no extension, select all.
    if (selectName && initial.includes('.')) {
      const dot = initial.lastIndexOf('.');
      el.setSelectionRange(0, dot);
    } else {
      el.select();
    }
  }, [initial, selectName]);

  const commit = () => {
    if (committed.current) return;
    committed.current = true;
    const v = ref.current?.value.trim() ?? '';
    if (!v || v === initial) {
      onCancel();
      return;
    }
    onCommit(v);
  };

  return (
    <input
      ref={ref}
      type="text"
      defaultValue={initial}
      placeholder={placeholder}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          committed.current = true;
          onCancel();
        }
      }}
      onBlur={commit}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'flex-1 min-w-0 rounded-[4px] border border-[var(--color-accent-500)]',
        'bg-[var(--color-paper-0)] px-1.5 py-[1px] text-[13px]',
        'text-[var(--color-ink-900)] outline-none',
        'ring-[2.5px] ring-[var(--color-accent-500)]/20',
      )}
    />
  );
}
