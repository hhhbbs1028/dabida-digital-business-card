import React, { useState } from 'react';
import type { CommunityProfile } from '../types';
import { FindFriendsTab } from '../components/FindFriendsTab';
import { WaveTab } from '../components/WaveTab';
import { BoardTab } from '../components/BoardTab';
import { ProfileDetailModal } from '../components/ProfileDetailModal';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { ChatTab } from '../components/ChatTab';
import { createOrGetDm } from '../api/chatsApi';
import { useToast } from '../../../shared/ui/Toast';

type SubTab = 'find' | 'wave' | 'board' | 'chat';

export function CommunityPage() {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('find');
  const [selectedProfile, setSelectedProfile] = useState<CommunityProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);

  const handleProfileClick = (profile: CommunityProfile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  const handleSendMessage = async (userId: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/38073a1c-5724-42d5-8104-b1a59577e942',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommunityPage.tsx:28',message:'handleSendMessage 시작',data:{userId,userIdType:typeof userId,userIdLength:userId?.length,isUUIDFormat:/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      console.log('[CommunityPage] DM 생성 시작:', { 
        userId, 
        userIdType: typeof userId,
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      });
      
      // 개발 모드: Mock 데이터의 user_id를 실제 사용자 ID로 매핑 (테스트용)
      let actualUserId = userId;
      if (import.meta.env.DEV && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        // Mock 데이터의 user_id인 경우, 실제 사용자 목록에서 첫 번째 사용자를 찾거나
        // 현재 사용자와 다른 실제 사용자 ID를 사용
        // 임시로: Mock 데이터 사용자와 채팅하려면 자기 자신과 채팅하는 것으로 처리
        // (실제로는 다른 사용자 계정이 필요하지만, 개발 모드에서는 경고만 표시)
        console.warn('[CommunityPage] Mock 데이터 사용자 감지:', userId);
        console.warn('[CommunityPage] 개발 모드: Mock 데이터 사용자와는 채팅할 수 없습니다.');
        console.warn('[CommunityPage] 테스트 방법:');
        console.warn('  1. 다른 브라우저/기기에서 다른 계정으로 로그인');
        console.warn('  2. 그 계정의 user_id를 사용하여 채팅 테스트');
        console.warn('  3. 또는 Supabase에서 실제 사용자 ID를 확인하여 사용');
        
        showToast('Mock 데이터 사용자와는 채팅할 수 없습니다. 실제 사용자 계정이 필요합니다.', 'error');
        return;
      }
      
      const conversation = await createOrGetDm(actualUserId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/38073a1c-5724-42d5-8104-b1a59577e942',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommunityPage.tsx:32',message:'DM 생성 성공',data:{conversationId:conversation.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.log('[CommunityPage] DM 생성 성공:', { 
        conversationId: conversation.id,
        members: conversation.members,
        memberCount: conversation.members.length
      });
      
      // 채팅 탭으로 이동
      setChatConversationId(conversation.id);
      setActiveSubTab('chat');
      // 프로필 모달 닫기
      setShowProfileModal(false);
      setSelectedProfile(null);
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/38073a1c-5724-42d5-8104-b1a59577e942',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommunityPage.tsx:38',message:'DM 생성 실패',data:{error:err?.message,code:err?.code,details:err?.details,hint:err?.hint,fullError:JSON.stringify(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('[CommunityPage] DM 생성 오류:', err);
      const errorMessage = err?.message || err?.error?.message || '알 수 없는 오류';
      console.error('[CommunityPage] 상세 오류:', {
        message: errorMessage,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      showToast(`메시지 보내기에 실패했습니다: ${errorMessage}`, 'error');
    }
  };


  const subTabs: { id: SubTab; label: string; icon: string }[] = [
    { id: 'find', label: '친구찾기', icon: '🔍' },
    { id: 'wave', label: '파도타기', icon: '🌊' },
    { id: 'board', label: '게시판', icon: '📋' },
    { id: 'chat', label: '채팅', icon: '💬' },
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
              onClick={() => {
                setActiveSubTab(tab.id);
                // 채팅 탭을 직접 클릭하면 특정 대화방 자동선택 해제
                if (tab.id !== 'chat') setChatConversationId(null);
              }}
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
        {activeSubTab === 'find' && (
          <FindFriendsTab
            onProfileClick={handleProfileClick}
            onSendMessage={handleSendMessage}
          />
        )}
        {activeSubTab === 'wave' && (
          <WaveTab
            onProfileClick={handleProfileClick}
            onSendMessage={handleSendMessage}
          />
        )}
        {activeSubTab === 'board' && <BoardTab onSendMessage={handleSendMessage} />}
        {activeSubTab === 'chat' && (
          <ChatTab initialConversationId={chatConversationId} />
        )}
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

