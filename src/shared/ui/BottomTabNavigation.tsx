import React from 'react';

type Tab = 'home' | 'cards' | 'exchange' | 'profile';

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function BottomTabNavigation({ activeTab, onTabChange }: Props) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: '홈', icon: '🏠' },
    { id: 'cards', label: '명함', icon: '💳' },
    { id: 'exchange', label: '교환', icon: '📲' },
    { id: 'profile', label: '내정보', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white shadow-lg md:hidden">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={[
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-4 py-2 transition touch-manipulation',
                isActive ? 'text-primary-600' : 'text-slate-500',
              ].join(' ')}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 h-0.5 w-12 rounded-t-full bg-primary-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

