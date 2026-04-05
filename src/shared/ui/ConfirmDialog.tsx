import React, { useEffect } from 'react';

type Props = {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white px-6 py-5 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {message && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{message}</p>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className={[
              'w-full rounded-xl py-3 text-sm font-semibold transition active:scale-[0.98]',
              destructive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-slate-900 text-white hover:bg-slate-800',
            ].join(' ')}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </>
  );
}
