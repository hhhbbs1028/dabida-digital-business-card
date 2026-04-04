import { useRef, useState } from 'react';
import type { CardData } from '../types';
import { CardPreview } from './CardPreview';

type Props = {
  cards: CardData[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onDeleteDirect: (id: string) => void;
};

const SWIPE_THRESHOLD = 60; // px
const DELETE_REVEAL_WIDTH = 88; // px

export function CardsList({
  cards,
  selectedId,
  loading,
  error,
  onSelect,
  onDeleteDirect,
}: Props) {
  const [swipedCardId, setSwipedCardId] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const isDragging = useRef(false);

  function handleTouchStart(e: React.TouchEvent, cardId: string) {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = false;

    if (swipedCardId && swipedCardId !== cardId) {
      setSwipedCardId(null);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchCurrentX.current = e.touches[0].clientX;
    const delta = touchCurrentX.current - touchStartX.current;
    if (Math.abs(delta) > 10) {
      isDragging.current = true;
    }
  }

  function handleTouchEnd(cardId: string) {
    const delta = touchCurrentX.current - touchStartX.current;

    if (delta < -SWIPE_THRESHOLD) {
      setSwipedCardId(cardId);
    } else if (delta > 10) {
      setSwipedCardId(null);
    }
  }

  function handleCardClick(cardId: string) {
    if (isDragging.current) return;
    if (swipedCardId === cardId) {
      setSwipedCardId(null);
      return;
    }
    onSelect(cardId);
  }

  function handleDelete(e: React.MouseEvent, cardId: string) {
    e.stopPropagation();
    if (confirm('정말 삭제하시겠습니까?')) {
      onDeleteDirect(cardId);
      setSwipedCardId(null);
    }
  }

  return (
    <aside>
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900">내 명함</h2>
        {cards.length > 0 && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
            {cards.length}장
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-400">명함을 불러오는 중입니다...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-500">
              {error}
            </div>
          )}

          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-gray-50 px-6 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                💳
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-gray-800">아직 저장된 명함이 없어요</p>
                <p className="text-xs text-gray-400">아래 + 버튼을 눌러 첫 번째 명함을 만들어보세요.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* 스와이프 안내 힌트 */}
              <div className="flex items-center gap-1.5 rounded-xl bg-blue-50/60 px-3 py-2">
                {/* 손가락 스와이프 아이콘 */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-blue-400" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11V6a2 2 0 0 1 4 0v5" />
                  <path d="M13 11V8a2 2 0 0 1 4 0v3" />
                  <path d="M17 11v-1a2 2 0 0 1 4 0v4a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a2 2 0 0 1 4 0v3" />
                  <path d="M3 9V7a2 2 0 0 1 2-2" />
                </svg>
                <p className="text-xs font-medium text-blue-500">카드를 왼쪽으로 밀면 삭제할 수 있어요</p>
              </div>

              {cards.map((card) => {
                const isActive = selectedId === card.id;
                const isSwiped = swipedCardId === card.id;

                return (
                  <div
                    key={card.id}
                    className="relative overflow-hidden rounded-2xl"
                    style={{
                      boxShadow: '0 2px 12px 0 rgba(0,0,0,0.07), 0 1px 3px 0 rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* 삭제 버튼 */}
                    <div
                      className="absolute inset-y-0 right-0 flex items-center justify-center transition-all duration-200"
                      style={{
                        width: DELETE_REVEAL_WIDTH,
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      }}
                    >
                      <button
                        onClick={(e) => handleDelete(e, card.id)}
                        className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-[11px] font-semibold tracking-wide">삭제</span>
                      </button>
                    </div>

                    {/* 카드 본체 */}
                    <div
                      onTouchStart={(e) => handleTouchStart(e, card.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() => handleTouchEnd(card.id)}
                      onClick={() => handleCardClick(card.id)}
                      className="relative cursor-pointer overflow-hidden rounded-2xl transition-transform duration-200 active:scale-[0.99] bg-slate-50"
                      style={{
                        transform: isSwiped ? `translateX(-${DELETE_REVEAL_WIDTH}px)` : 'translateX(0)',
                        outline: isActive ? '2px solid #3182f6' : 'none',
                        outlineOffset: '2px',
                        padding: '10px',
                      }}
                    >
                      <CardPreview card={card} />

                      {/* 스와이프 방향 힌트 화살표 (열리지 않은 상태에서만) */}
                      {!isSwiped && (
                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center opacity-20">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
