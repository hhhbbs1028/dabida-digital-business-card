import React from 'react';

type OptionalFieldGroupProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function OptionalFieldGroup({
  title,
  description,
  isOpen,
  onToggle,
  children,
}: OptionalFieldGroupProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-1 text-[11px] text-slate-500">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:border-slate-300"
        >
          {isOpen ? '접기' : '항목 추가 +'}
        </button>
      </div>
      {isOpen && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}


