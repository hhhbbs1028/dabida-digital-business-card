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
      className="fixed bottom-24 right-6 z-40 flex h-14 w-14 min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-primary-600 text-2xl font-semibold text-white shadow-lg transition hover:bg-primary-700 hover:shadow-xl active:scale-95 md:hidden touch-manipulation"
      aria-label={label || '새 명함 만들기'}
    >
      {icon}
    </button>
  );
}

