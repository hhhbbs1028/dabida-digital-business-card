import React, { useState, useEffect, useRef } from 'react';
import type { ConversationWithMembers, Message, CommunityProfile } from '../types';
import { listConversations, listMessages, sendMessage, createOrGetDm } from '../api/chatsApi';
import { getProfiles } from '../api/profilesApi';
import { useToast } from '../../../shared/ui/Toast';
import { useAuth } from '../../auth/hooks/useAuth';
import { supabase } from '../../../shared/infrastructure/supabaseClient';

type Props = {
  onStartChat?: (targetUserId: string) => void;
  initialConversationId?: string | null;
};

export function ChatTab({ onStartChat, initialConversationId }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithMembers[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [profileMap, setProfileMap] = useState<Map<string, CommunityProfile>>(new Map());
  const [cardNameMap, setCardNameMap] = useState<Map<string, string>>(new Map()); // user_id -> card display_name
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const userDeselectedRef = useRef(false); // 사용자가 직접 뒤로가기를 눌렀는지 추적

  console.log('[ChatTab] 렌더링:', { 
    initialConversationId, 
    selectedConvId, 
    conversationsCount: conversations.length,
    hasUser: !!user 
  });

  useEffect(() => {
    console.log('[ChatTab] 대화방 목록 로드 시작');
    loadConversations();
  }, []);

  // 초기 대화방 ID가 있으면 즉시 선택 (목록 로드 전에도)
  // 단, 사용자가 직접 뒤로가기를 눌러서 null로 설정한 경우는 무시
  useEffect(() => {
    // initialConversationId가 변경되면 userDeselectedRef 초기화 (새로운 대화방 시작)
    if (initialConversationId) {
      userDeselectedRef.current = false;
    }
    
    if (userDeselectedRef.current) {
      // 사용자가 직접 뒤로가기를 눌렀으면 무시
      return;
    }
    
    if (initialConversationId && initialConversationId !== selectedConvId) {
      console.log('[ChatTab] initialConversationId로 대화방 즉시 선택:', initialConversationId);
      setSelectedConvId(initialConversationId);
    }
  }, [initialConversationId]);

  // 초기 대화방 ID가 있고 대화방 목록이 로드되면 선택
  useEffect(() => {
    console.log('[ChatTab] initialConversationId 변경 감지:', { 
      initialConversationId, 
      conversationsCount: conversations.length,
      selectedConvId 
    });
    
    // 사용자가 직접 뒤로가기를 눌렀으면 무시
    if (userDeselectedRef.current) {
      return;
    }
    
    if (initialConversationId && conversations.length > 0) {
      const exists = conversations.some((c) => c.id === initialConversationId);
      console.log('[ChatTab] 대화방 존재 여부 확인:', { 
        initialConversationId, 
        exists,
        currentSelected: selectedConvId 
      });
      
      if (exists && initialConversationId !== selectedConvId) {
        console.log('[ChatTab] 대화방 선택:', initialConversationId);
        setSelectedConvId(initialConversationId);
      } else if (!exists) {
        // 대화방이 목록에 없으면 새로고침
        console.log('[ChatTab] 대화방이 목록에 없음, 새로고침');
        loadConversations();
      }
    } else if (initialConversationId && conversations.length === 0 && !loading) {
      // 대화방 목록이 아직 로드되지 않았으면 로드
      console.log('[ChatTab] 대화방 목록 로드 시작 (initialConversationId 있음)');
      loadConversations();
    }
  }, [initialConversationId, conversations, selectedConvId, loading]);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
      // Realtime 구독 시작
      subscribeToMessages(selectedConvId);
    } else {
      setMessages([]);
    }

    // cleanup: 구독 해제
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [selectedConvId]);

  // 메시지 목록이 업데이트되면 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Supabase Realtime 구독
  const subscribeToMessages = (conversationId: string) => {
    // 기존 구독 해제
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // 새 구독 시작
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('[ChatTab] 새 메시지 수신:', payload);
          const newMessage = payload.new as any;
          setMessages((prev) => {
            // 중복 방지
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, {
              id: newMessage.id,
              conversation_id: newMessage.conversation_id,
              sender_id: newMessage.sender_id,
              content: newMessage.content,
              created_at: newMessage.created_at,
            }];
          });
          // 대화방 목록도 업데이트
          loadConversations();
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await listConversations();
      
      // TODO : 채팅방 중복 오류
      // 중복 제거: 같은 conversation_id가 여러 번 나올 수 있으므로 Map 사용
      const conversationMap = new Map<string, ConversationWithMembers>();
      data.forEach((conv) => {
        if (!conversationMap.has(conv.id)) {
          conversationMap.set(conv.id, conv);
        }
      });
      
      const uniqueConversations = Array.from(conversationMap.values());
      console.log('[ChatTab] 대화방 목록 로드:', {
        원본: data.length,
        중복제거후: uniqueConversations.length,
        conversations: uniqueConversations.map((c) => ({
          id: c.id,
          memberCount: c.members.length,
          memberIds: c.members.map((m) => m.user_id),
        })),
      });
      
      setConversations(uniqueConversations);
      
      // 대화방 멤버들의 프로필 정보 로드
      const userIds = new Set<string>();
      data.forEach((conv) => {
        conv.members.forEach((m) => {
          if (m.user_id !== user?.id) {
            userIds.add(m.user_id);
          }
        });
      });
      
      if (userIds.size > 0) {
        try {
          const profiles = await getProfiles({});
          const newProfileMap = new Map<string, CommunityProfile>();
          profiles.forEach((p) => {
            if (userIds.has(p.user_id)) {
              newProfileMap.set(p.user_id, p);
            }
          });
          setProfileMap(newProfileMap);
        } catch (err) {
          console.warn('[ChatTab] 프로필 정보 로드 실패:', err);
        }
      }

      // 받은 명함에서 명함 이름 매핑 로드 (user_id -> card display_name)
      try {
        const { data: receivedCards } = await supabase
          .from('received_cards')
          .select('source_card_id, snapshot')
          .eq('owner_id', user?.id || '');
        
        if (receivedCards && receivedCards.length > 0) {
          const sourceCardIds = receivedCards
            .map((rc) => rc.source_card_id)
            .filter((id): id is string => id !== null);
          
          if (sourceCardIds.length > 0) {
            // cards 테이블에서 user_id와 display_name 조회
            const { data: cards } = await supabase
              .from('cards')
              .select('id, user_id, display_name')
              .in('id', sourceCardIds);
            
            if (cards) {
              const newCardNameMap = new Map<string, string>();
              // source_card_id로 user_id 찾기
              const cardIdToUserId = new Map(cards.map((c) => [c.id, c.user_id]));
              
              for (const rc of receivedCards) {
                if (rc.source_card_id && cardIdToUserId.has(rc.source_card_id)) {
                  const userId = cardIdToUserId.get(rc.source_card_id)!;
                  const card = cards.find((c) => c.id === rc.source_card_id);
                  if (card && card.display_name) {
                    newCardNameMap.set(userId, card.display_name);
                  }
                }
              }
              setCardNameMap(newCardNameMap);
            }
          }
        }
      } catch (err) {
        console.warn('[ChatTab] 명함 이름 매핑 로드 실패:', err);
      }
    } catch (err: any) {
      console.error('[ChatTab] 대화방 목록 조회 오류:', err);
      showToast('대화방을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await listMessages(conversationId);
      setMessages(data);
    } catch (err: any) {
      console.error('[ChatTab] 메시지 조회 오류:', err);
      showToast('메시지를 불러오지 못했습니다.', 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConvId || !messageInput.trim()) return;

    setSending(true);
    try {
      const newMessage = await sendMessage(selectedConvId, messageInput);
      setMessages((prev) => [...prev, newMessage]);
      setMessageInput('');
      
      // 대화방 목록 새로고침 (updated_at 업데이트)
      await loadConversations();
    } catch (err: any) {
      console.error('[ChatTab] 메시지 전송 오류:', err);
      showToast('메시지 전송에 실패했습니다.', 'error');
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const otherMember = selectedConv?.members.find((m) => m.user_id !== user?.id);

  console.log('[ChatTab] 렌더링 상태:', { 
    selectedConvId, 
    conversationsCount: conversations.length,
    messagesCount: messages.length,
    loading,
    hasUser: !!user
  });

  return (
    <div className="flex min-h-[400px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {selectedConvId ? (
        <>
          {/* 헤더: 상대방 정보 */}
          <div className="border-b border-slate-100 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[ChatTab] 뒤로가기 버튼 클릭, selectedConvId 초기화');
                  userDeselectedRef.current = true; // 사용자가 직접 뒤로가기를 눌렀음을 표시
                  setSelectedConvId(null);
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                  {otherMember ? (profileMap.get(otherMember.user_id)?.avatar_url ? (
                    <img
                      src={profileMap.get(otherMember.user_id)!.avatar_url!}
                      alt={profileMap.get(otherMember.user_id)?.display_name || 'User'}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    (cardNameMap.get(otherMember.user_id) || profileMap.get(otherMember.user_id)?.display_name || 'User').substring(0, 2).toUpperCase()
                  )) : '?'}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {otherMember ? (
                      cardNameMap.get(otherMember.user_id) || 
                      profileMap.get(otherMember.user_id)?.display_name || 
                      `User ${otherMember.user_id.slice(0, 8)}`
                    ) : '대화방'}
                  </p>
                  {otherMember && profileMap.get(otherMember.user_id)?.university && (
                    <p className="text-xs text-slate-400">
                      {profileMap.get(otherMember.user_id)!.university}
                      {profileMap.get(otherMember.user_id)!.major && ` · ${profileMap.get(otherMember.user_id)!.major}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" style={{ maxHeight: '500px' }}>
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">메시지가 없습니다</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMine = msg.sender_id === user?.id;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const showTime = !prevMsg || 
                  new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000; // 5분 이상 차이
                
                const formatTime = (dateString: string) => {
                  const date = new Date(dateString);
                  const hours = date.getHours();
                  const minutes = date.getMinutes();
                  const ampm = hours >= 12 ? '오후' : '오전';
                  const displayHours = hours % 12 || 12;
                  return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
                };

                return (
                  <div key={msg.id}>
                    {showTime && (
                      <div className="my-2 text-center">
                        <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isMine
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="border-t border-slate-100 bg-white p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="메시지 입력..."
                className="flex-1 rounded-2xl border-none bg-slate-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sending}
                className="rounded-2xl bg-primary-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
              >
                전송
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          {/* 헤더 - 미니멀 */}
          <div className="border-b border-gray-100 bg-bg-white px-4 py-3">
            <h2 className="text-lg font-bold text-text-primary">채팅</h2>
          </div>
          
          {/* 대화방 목록 */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '500px' }}>
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-secondary">불러오는 중...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-base font-medium text-text-secondary">대화방이 없습니다</p>
                  <p className="mt-2 text-sm text-text-tertiary">
                    프로필에서 "메시지 보내기"를 눌러 대화를 시작하세요
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations
                  .filter((conv, index, self) => 
                    // 중복 제거: 같은 conversation_id가 여러 번 나오는 경우 첫 번째만 유지
                    index === self.findIndex((c) => c.id === conv.id)
                  )
                  .map((conv) => {
                  const other = conv.members.find((m) => m.user_id !== user?.id);
                  const otherProfile = other ? profileMap.get(other.user_id) : null;
                  const displayName = otherProfile?.display_name || (other ? `User ${other.user_id.slice(0, 8)}` : '대화방');
                  const initials = displayName.substring(0, 2).toUpperCase();
                  
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConvId(conv.id)}
                      className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-bg-gray-light active:bg-gray-50"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-toss bg-gray-200 text-sm font-bold text-text-secondary">
                        {otherProfile?.avatar_url ? (
                          <img
                            src={otherProfile.avatar_url}
                            alt={displayName}
                            className="h-full w-full rounded-toss object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-text-primary">
                          {displayName}
                        </p>
                        {otherProfile?.university && (
                          <p className="mt-0.5 text-xs text-text-tertiary">
                            {otherProfile.university}
                            {otherProfile.major && ` · ${otherProfile.major}`}
                          </p>
                        )}
                        {conv.last_message && (
                          <p className="mt-1 truncate text-sm font-medium text-text-secondary">
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

