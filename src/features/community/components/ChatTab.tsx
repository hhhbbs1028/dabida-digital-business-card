import React, { useState, useEffect } from 'react';
import type { ConversationWithMembers, Message } from '../types';
import { listConversations, listMessages, sendMessage, createOrGetDm } from '../api/chatsApi';
import { useToast } from '../../../shared/ui/Toast';
import { useAuth } from '../../auth/hooks/useAuth';

type Props = {
  onStartChat?: (targetUserId: string) => void;
};

export function ChatTab({ onStartChat }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithMembers[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    } else {
      setMessages([]);
    }
  }, [selectedConvId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await listConversations();
      setConversations(data);
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

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col md:h-[600px]">
      {selectedConvId ? (
        <>
          {/* 메시지 영역 */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">메시지가 없습니다</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
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
                );
              })
            )}
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
        <div className="flex h-full flex-col">
          {/* 대화방 목록 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">불러오는 중...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-base text-slate-500">대화방이 없습니다</p>
                  <p className="mt-2 text-sm text-slate-400">
                    프로필에서 "메시지 보내기"를 눌러 대화를 시작하세요
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {conversations.map((conv) => {
                  const other = conv.members.find((m) => m.user_id !== user?.id);
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConvId(conv.id)}
                      className="flex w-full items-center gap-4 rounded-2xl bg-white px-4 py-4 text-left transition active:bg-slate-50"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                        👤
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-900">
                          {other ? `User ${other.user_id.slice(0, 8)}` : '대화방'}
                        </p>
                        {conv.last_message && (
                          <p className="mt-1 truncate text-sm text-slate-500">
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

