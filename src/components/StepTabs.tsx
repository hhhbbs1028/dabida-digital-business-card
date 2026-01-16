import React from 'react';

type StepTabsProps = {
  steps: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function StepTabs({ steps, activeIndex, onSelect }: StepTabsProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-5">
      <div className="flex flex-wrap gap-2">
        {steps.map((label, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(index)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}


