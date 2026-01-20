import React from 'react';

type Props = {
  onClick: () => void;
  icon?: string;
  label?: string;
};

export function FloatingActionButton({ onClick, icon = '＋', label }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-28 right-6 z-40 flex h-16 w-16 min-h-[64px] min-w-[64px] items-center justify-center rounded-full bg-primary-600 text-3xl font-semibold text-white transition hover:bg-primary-700 active:scale-95 md:hidden touch-manipulation"
      aria-label={label || '새 명함 만들기'}
    >
      {icon}
    </button>
  );
}

