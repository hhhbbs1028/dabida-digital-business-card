import React, { useState } from 'react';
import type { CommunityProfile } from '../types';
import { FindFriendsTab } from '../components/FindFriendsTab';
import { WaveTab } from '../components/WaveTab';
import { ChatTab } from '../components/ChatTab';
import { BoardTab } from '../components/BoardTab';
import { ProfileDetailModal } from '../components/ProfileDetailModal';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { createOrGetDm } from '../api/chatsApi';
import { useToast } from '../../../shared/ui/Toast';

type SubTab = 'find' | 'wave' | 'chat' | 'board';

export function CommunityPage() {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('find');
  const [selectedProfile, setSelectedProfile] = useState<CommunityProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleProfileClick = (profile: CommunityProfile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  const handleSendMessage = async (userId: string) => {
    try {
      await createOrGetDm(userId);
      setActiveSubTab('chat');
      showToast('대화방이 열렸습니다.', 'success');
      // TODO: ChatTab에서 해당 대화방으로 이동
    } catch (err: any) {
      console.error('[CommunityPage] DM 생성 오류:', err);
      showToast('메시지 보내기에 실패했습니다.', 'error');
    }
  };

  const subTabs: { id: SubTab; label: string; icon: string }[] = [
    { id: 'find', label: '친구찾기', icon: '🔍' },
    { id: 'wave', label: '파도타기', icon: '🌊' },
    { id: 'chat', label: '채팅', icon: '💬' },
    { id: 'board', label: '게시판', icon: '📋' },
  ];

  return (
    <div className="space-y-6">
      {/* 서브 탭 */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={[
                'flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 서브 탭 컨텐츠 */}
      <div>
        {activeSubTab === 'find' && <FindFriendsTab onProfileClick={handleProfileClick} />}
        {activeSubTab === 'wave' && <WaveTab onProfileClick={handleProfileClick} />}
        {activeSubTab === 'chat' && <ChatTab />}
        {activeSubTab === 'board' && <BoardTab />}
      </div>

      {/* 프로필 상세 모달 */}
      <BottomSheet
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProfile(null);
        }}
        title="프로필"
      >
        <ProfileDetailModal
          profile={selectedProfile}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedProfile(null);
          }}
          onSendMessage={handleSendMessage}
        />
      </BottomSheet>
    </div>
  );
}

