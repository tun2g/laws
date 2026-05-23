import Link from 'next/link';
import Image from 'next/image';
import { env } from '@/config/env';

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <Image
        src="/logo-gemini.png"
        alt={`${env.brandName} logo`}
        width={36}
        height={36}
        className="h-9 w-9 rounded-[5px] object-cover"
        priority
      />
      {compact ? null : (
        <div className="leading-none">
          <div
            className="font-serif text-[18px] tracking-[-0.015em] text-[var(--color-ink-900)]"
            style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 144, 'wght' 600" }}
          >
            {env.brandName}
          </div>
          <div className="overline mt-1 text-[9px]">Counsel · Hà Nội</div>
        </div>
      )}
    </Link>
  );
}
