import React, { useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function BottomSheet({ isOpen, onClose, title, children }: Props) {
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
      
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-3xl bg-white shadow-2xl transition-transform">
        {/* Handle */}
        <div className="flex cursor-grab active:cursor-grabbing items-center justify-center pt-3 pb-2">
          <div className="h-1.5 w-16 rounded-full bg-slate-300" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:bg-slate-200"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {children}
        </div>
      </div>
    </>
  );
}

