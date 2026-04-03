import React from 'react';
import type { ReceivedCard, ReceivedCardSnapshot } from '../types';
import { CardPreview } from '../../cards/components/CardPreview';
import type { CardData } from '../../cards/types';

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

function snapshotToCardData(snapshot: ReceivedCardSnapshot): Omit<CardData, 'id'> {
  return {
    display_name: snapshot.display_name ?? '',
    headline: snapshot.headline ?? '',
    organization: snapshot.organization ?? '',
    email: snapshot.email ?? '',
    phone: snapshot.phone ?? '',
    links: {
      instagram: snapshot.links?.instagram ?? '',
      github: snapshot.links?.github ?? '',
      website: snapshot.links?.website ?? '',
    },
    style: {
      template_id: (snapshot.style?.template_id as 1 | 2) ?? 1,
      theme_color: snapshot.style?.theme_color ?? '#111827',
      font_family: (snapshot.style?.font_family as any) ?? 'sans',
      orientation: (snapshot.style?.orientation as any) ?? 'horizontal',
    },
    profile_url: snapshot.profile_url ?? null,
    logo_url: snapshot.logo_url ?? null,
    theme: snapshot.theme ?? null,
  };
}

export function ReceivedCardsList({
  cards,
  selectedId,
  loading,
  error,
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
          <div className="flex flex-col gap-4">
            {cards.map((card) => {
              const isActive = selectedId === card.id;
              const isMenuOpen = menuOpenId === card.id;
              const canChat = !!card.source_card_id && !!onChat;
              const cardData = snapshotToCardData(card.snapshot);
              const isPortrait = cardData.theme?.orientation === 'portrait';

              return (
                <div key={card.id} className="relative">
                  <div
                    className={[
                      'relative overflow-hidden rounded-2xl cursor-pointer transition-shadow',
                      isActive
                        ? 'ring-2 ring-primary-500 shadow-md'
                        : 'shadow-sm hover:shadow-md',
                    ].join(' ')}
                    style={{ maxWidth: isPortrait ? 200 : '100%', margin: isPortrait ? '0 auto' : undefined }}
                    onClick={() => {
                      setMenuOpenId(null);
                      onSelect(card.id);
                    }}
                  >
                    <CardPreview card={cardData} />

                    {/* 우상단 액션 버튼들 */}
                    <div
                      className="absolute top-2 right-2 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 채팅 버튼 */}
                      {canChat && (
                        <button
                          type="button"
                          onClick={() => onChat(card)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-primary-500 shadow transition hover:bg-white active:bg-gray-100"
                          title="채팅하기"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                      )}

                      {/* ⋯ 메뉴 버튼 */}
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(isMenuOpen ? null : card.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-text-tertiary shadow transition hover:bg-white active:bg-gray-100"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 메뉴 드롭다운 */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-12 z-20 rounded-toss-xl bg-bg-white p-1 shadow-toss-md border border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(card.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full rounded-toss px-4 py-3 text-left text-sm font-medium text-text-primary transition hover:bg-gray-50"
                        >
                          상세보기
                        </button>
                        <button
                          type="button"
                          onClick={() => {
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
