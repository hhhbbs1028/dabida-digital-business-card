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
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-3xl bg-white transition-transform">
        {/* Handle */}
        <div className="sticky top-0 z-10 flex cursor-grab active:cursor-grabbing items-center justify-center bg-white pt-3 pb-2">
          <div className="h-1.5 w-16 rounded-full bg-slate-300" />
        </div>
        
        {/* Header - 고정 */}
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:bg-slate-200"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
        )}
        
        {/* Content - 스크롤 가능 */}
        <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {children}
        </div>
      </div>
    </>
  );
}

