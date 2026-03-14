import React, { useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  stickyPreview?: React.ReactNode;
  children: React.ReactNode;
};

export function BottomSheet({ isOpen, onClose, title, stickyPreview, children }: Props) {
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
        className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[90vh] flex-col rounded-t-3xl bg-white pb-14 md:pb-0">
        {/* Handle */}
        <div className="flex flex-shrink-0 cursor-grab active:cursor-grabbing items-center justify-center pt-3 pb-1">
          <div className="h-1.5 w-16 rounded-full bg-slate-300" />
        </div>

        {/* Header - 고정 */}
        {title && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:bg-slate-200"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
        )}

        {/* 미리보기 슬롯 - 고정 */}
        {stickyPreview && (
          <div className="flex-shrink-0 border-b border-slate-100 bg-slate-50">
            {stickyPreview}
          </div>
        )}

        {/* Content - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </>
  );
}

