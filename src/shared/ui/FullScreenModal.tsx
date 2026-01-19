import React, { useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function FullScreenModal({ isOpen, onClose, title, children }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[90vh] md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-2xl">
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <h2 className="text-lg font-semibold text-slate-900">{title || ''}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:bg-slate-200"
          >
            <span className="text-xl">×</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </>
  );
}

