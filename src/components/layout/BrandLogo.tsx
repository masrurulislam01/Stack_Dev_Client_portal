import {Code2} from 'lucide-react';

interface BrandLogoProps {
  collapsed?: boolean;
  variant?: 'default' | 'inverted';
  size?: 'sm' | 'md';
}

export function BrandLogo({
  collapsed = false,
  variant = 'default',
  size = 'md',
}: BrandLogoProps) {
  const boxSize = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';
  const textClass =
    size === 'sm'
      ? 'font-heading text-base font-extrabold tracking-tight'
      : 'font-heading text-lg font-extrabold tracking-tight';

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        aria-hidden="true"
        className={`${boxSize} inline-flex items-center justify-center shrink-0 ${
          variant === 'inverted'
            ? 'bg-white/15 border border-white/25 text-white'
            : 'bg-gradient-brand text-white shadow-xs'
        }`}
      >
        <Code2 className={iconSize} strokeWidth={2.25} />
      </span>
      {!collapsed && (
        <span
          className={`${textClass} ${
            variant === 'inverted' ? 'text-white' : 'text-foreground'
          }`}
        >
          Stack Dev
        </span>
      )}
    </span>
  );
}
