/**
 * Icon glyphs shared by FilesTab toolbar + filter input. Kept here to keep
 * the orchestrator component focused on state + handlers.
 */

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function FolderPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

export function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 4v4h-4M3 20v-4h4" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[12px] font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-paper-100)] hover:text-[var(--color-ink-900)] transition-colors"
    >
      {children}
    </button>
  );
}

export function EmptyPreview() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="text-center">
        <p
          className="font-serif text-[19px] text-[var(--color-ink-700)] tracking-[-0.01em]"
          style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 28, 'wght' 480" }}
        >
          Chọn một tệp để xem
        </p>
        <p className="mt-1 text-[12.5px] text-[var(--color-ink-500)]">
          Tạo tệp / thư mục mới ở thanh công cụ, hoặc kéo-thả tệp từ máy bạn vào đây.
        </p>
      </div>
    </div>
  );
}
