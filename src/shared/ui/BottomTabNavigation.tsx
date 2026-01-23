import React from 'react';

type Tab = 'home' | 'cards' | 'received' | 'exchange' | 'community' | 'profile';

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function BottomTabNavigation({ activeTab, onTabChange }: Props) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: '홈', icon: '🏠' },
    { id: 'cards', label: '명함', icon: '💳' },
    { id: 'received', label: '받은 명함', icon: '📇' },
    { id: 'exchange', label: '교환', icon: '📲' },
    { id: 'community', label: '커뮤니티', icon: '👥' },
    { id: 'profile', label: '내정보', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/95 backdrop-blur md:hidden">
      <div className="flex h-14 items-stretch overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={[
                'relative flex shrink-0 min-w-[60px] min-h-[40px] flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] transition touch-manipulation',
                isActive ? 'text-primary-600' : 'text-slate-500',
              ].join(' ')}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[9px] font-semibold leading-tight whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <div className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-primary-600" />
              )}
            </button>
          );
        })}
      </div>
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
}

