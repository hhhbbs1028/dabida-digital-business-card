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
      className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+16px)] right-5 z-40 flex h-14 w-14 min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95 md:hidden touch-manipulation"
      aria-label={label || '새 명함 만들기'}
    >
      {icon}
    </button>
  );
}

