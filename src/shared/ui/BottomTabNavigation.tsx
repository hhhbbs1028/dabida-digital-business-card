import React from 'react';

type Tab = 'home' | 'cards' | 'received' | 'exchange' | 'community' | 'profile';

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

// 얇은 선 스타일 아이콘 (SVG)
const IconHome = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#3182f6' : '#8b95a1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconCards = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#3182f6' : '#8b95a1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="10" y1="3" x2="10" y2="21" />
  </svg>
);

const IconReceived = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#3182f6' : '#8b95a1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconExchange = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#3182f6' : '#8b95a1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconCommunity = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#3182f6' : '#8b95a1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconProfile = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#3182f6' : '#8b95a1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export function BottomTabNavigation({ activeTab, onTabChange }: Props) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: '홈', icon: <IconHome isActive={activeTab === 'home'} /> },
    { id: 'cards', label: '명함', icon: <IconCards isActive={activeTab === 'cards'} /> },
    { id: 'received', label: '받은 명함', icon: <IconReceived isActive={activeTab === 'received'} /> },
    { id: 'exchange', label: '교환', icon: <IconExchange isActive={activeTab === 'exchange'} /> },
    { id: 'community', label: '커뮤니티', icon: <IconCommunity isActive={activeTab === 'community'} /> },
    { id: 'profile', label: '내정보', icon: <IconProfile isActive={activeTab === 'profile'} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-bg-white/95 backdrop-blur-md md:hidden">
      <div className="flex h-16 items-stretch overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={[
                'relative flex shrink-0 min-w-[64px] flex-1 flex-col items-center justify-center gap-1 px-2 py-2 transition-all touch-manipulation',
                isActive ? 'text-primary-500' : 'text-text-tertiary',
              ].join(' ')}
            >
              <div className="flex items-center justify-center">
                {tab.icon}
              </div>
              <span className={[
                'text-[11px] font-medium leading-tight whitespace-nowrap',
                isActive ? 'text-primary-500' : 'text-text-tertiary',
              ].join(' ')}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary-500" />
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

