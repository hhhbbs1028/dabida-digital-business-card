import { useState } from 'react';
import type { CardLevel } from '../levels/computeCardLevel';
import { LEVEL_META } from '../levels/levelMeta';
import { BottomSheet } from '../../../shared/ui/BottomSheet';

type Props = {
  level: CardLevel;
  size?: 'sm' | 'md';
  withTooltip?: boolean;
};

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-[18px] px-1.5 text-[10px]',
  md: 'h-6 px-2 text-xs',
};

export function CardLevelBadge({ level, size = 'sm', withTooltip = false }: Props) {
  const meta = LEVEL_META[level];
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const className = [
    'inline-flex items-center justify-center rounded-full font-bold leading-none select-none',
    SIZE_CLASS[size],
    meta.bgClass,
    meta.textClass,
    meta.ringClass,
  ]
    .filter(Boolean)
    .join(' ');

  function handleClick(e: React.MouseEvent) {
    if (!withTooltip) return;
    e.stopPropagation();
    setIsSheetOpen(true);
  }

  return (
    <>
      <span
        role={withTooltip ? 'button' : undefined}
        tabIndex={withTooltip ? 0 : undefined}
        aria-label={`명함 레벨: ${meta.label}`}
        onClick={withTooltip ? handleClick : undefined}
        onKeyDown={
          withTooltip
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSheetOpen(true);
                }
              }
            : undefined
        }
        className={className}
      >
        {meta.label}
      </span>

      {withTooltip && (
        <BottomSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title={`${meta.label} 명함`}
        >
          <p className="text-sm leading-relaxed text-slate-600">{meta.description}</p>
        </BottomSheet>
      )}
    </>
  );
}
