import React from 'react';
import type { ReceivedCard } from '../types';

type Props = {
  cards: ReceivedCard[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  sortBy?: 'name' | 'newest' | 'oldest';
  onSortChange?: (sortBy: 'name' | 'newest' | 'oldest') => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onChat?: (card: ReceivedCard) => void;
};

// 이니셜 생성 함수
const getInitials = (name: string) => {
  if (!name) return '👤';
  const names = name.trim().split(/\s+/);
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function ReceivedCardsList({
  cards,
  selectedId,
  loading,
  error,
  sortBy = 'newest',
  onSortChange,
  onSelect,
  onDelete,
  onChat,
}: Props) {
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);

  return (
    <div className="flex-1">
      <div className="space-y-4">
        {error && (
          <div className="mb-4 rounded-toss border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-text-secondary">명함을 불러오는 중입니다...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-toss-xl bg-bg-gray px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-toss-xl bg-primary-50 text-2xl">
              📇
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-text-primary">
                아직 받은 명함이 없어요
              </p>
              <p className="text-xs text-text-tertiary">
                명함을 추가하면 여기에 표시됩니다.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {cards.map((card, index) => {
              const isActive = selectedId === card.id;
              const snapshot = card.snapshot;
              const displayName = snapshot.display_name || '이름 없음';
              const initials = getInitials(displayName);
              const isMenuOpen = menuOpenId === card.id;
              const canChat = !!card.source_card_id && !!onChat;
              return (
                <li key={card.id} className="relative">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelect(card.id)}
                      className={[
                        'flex min-h-[72px] w-full flex-1 items-center gap-4 px-4 py-4 text-left transition-all touch-manipulation',
                        isActive
                          ? 'bg-primary-50'
                          : 'hover:bg-bg-gray-light active:bg-gray-50',
                      ].join(' ')}
                    >
                      {/* 프로필 이니셜 */}
                      <div
                        className={[
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-toss text-sm font-bold',
                          isActive
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 text-text-secondary',
                        ].join(' ')}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Primary: 이름 - 1줄 ellipsis */}
                        <p className={[
                          'truncate text-base font-bold leading-tight',
                          isActive ? 'text-primary-500' : 'text-text-primary',
                        ].join(' ')}>
                          {displayName}
                        </p>
                        {/* Secondary: 직무/한 줄 소개 - 1줄 ellipsis */}
                        <p className="mt-0.5 truncate text-sm leading-relaxed text-text-secondary">
                          {snapshot.headline || snapshot.organization || '설명 없음'}
                        </p>
                      </div>
                    </button>
                    {/* 채팅 버튼 */}
                    {canChat && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChat(card);
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-toss bg-primary-50 text-primary-500 transition hover:bg-primary-100 active:bg-primary-200 touch-manipulation"
                        title="채팅하기"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    )}
                    {/* ⋯ 메뉴 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : card.id);
                      }}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-toss text-text-tertiary transition hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                  </div>
                  {/* 메뉴 드롭다운 */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-14 z-20 rounded-toss-xl bg-bg-white p-1 shadow-toss-md border border-gray-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(card.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full rounded-toss px-4 py-3 text-left text-sm font-medium text-text-primary transition hover:bg-gray-50"
                        >
                          상세보기
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(card.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full rounded-toss px-4 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

