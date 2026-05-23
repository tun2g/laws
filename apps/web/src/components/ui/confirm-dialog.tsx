'use client';

import { useEffect } from 'react';
import { Button } from './button';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Paper-card confirmation modal. Replaces window.confirm() — keeps the
 * editorial aesthetic and lets us style destructive actions in lacquer.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  destructive = false,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink-900)]/55 backdrop-blur-sm px-4 paper-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[8px] border border-[var(--color-paper-200)] bg-[var(--color-paper-0)] shadow-[var(--shadow-paper-lg)]"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
      >
        <div className="px-6 py-5">
          <h3
            className="font-serif text-[19px] tracking-[-0.015em] text-[var(--color-ink-900)]"
            style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 28, 'wght' 520" }}
          >
            {title}
          </h3>
          {description ? (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-600)]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-paper-200)] bg-[var(--color-paper-50)] px-6 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
