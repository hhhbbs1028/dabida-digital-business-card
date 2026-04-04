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
const DELETE_REVEAL_WIDTH = 80; // px

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

    // 다른 카드가 열려있으면 닫기
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
      // 왼쪽으로 충분히 스와이프 → 삭제 버튼 노출
      setSwipedCardId(cardId);
    } else if (delta > 10) {
      // 오른쪽으로 스와이프 → 닫기
      setSwipedCardId(null);
    }
  }

  function handleCardClick(cardId: string) {
    if (isDragging.current) return;
    if (swipedCardId === cardId) {
      // 열린 상태에서 카드 탭 → 닫기
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
      <div className="mb-5">
        <h2 className="text-lg font-bold text-text-primary">내 명함</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-secondary">명함을 불러오는 중입니다...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-toss border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
              {error}
            </div>
          )}

          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-toss-xl bg-bg-gray px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-toss-xl bg-primary-50 text-2xl">
                💳
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-text-primary">아직 저장된 명함이 없어요</p>
                <p className="text-xs text-text-tertiary">오른쪽에서 첫 번째 명함을 만들어보세요.</p>
              </div>
            </div>
          ) : (
            /* ── 카드 스택 ── */
            <div className="flex flex-col gap-1">
              {cards.map((card) => {
                const isActive = selectedId === card.id;
                const isSwiped = swipedCardId === card.id;

                return (
                  <div
                    key={card.id}
                    className="relative overflow-hidden rounded-2xl"
                  >
                    {/* 삭제 버튼 (스와이프 시 우측에서 노출) */}
                    <div
                      className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 transition-all duration-200"
                      style={{ width: DELETE_REVEAL_WIDTH }}
                    >
                      <button
                        onClick={(e) => handleDelete(e, card.id)}
                        className="flex h-full w-full flex-col items-center justify-center gap-1 text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-xs font-medium">삭제</span>
                      </button>
                    </div>

                    {/* 카드 본체 (스와이프 시 왼쪽으로 이동) */}
                    <div
                      onTouchStart={(e) => handleTouchStart(e, card.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() => handleTouchEnd(card.id)}
                      onClick={() => handleCardClick(card.id)}
                      className="relative cursor-pointer overflow-hidden rounded-2xl p-2.5 transition-transform duration-200 active:scale-[0.98]"
                      style={{
                        transform: isSwiped ? `translateX(-${DELETE_REVEAL_WIDTH}px)` : 'translateX(0)',
                        outline: isActive ? '2px solid #9299aa' : 'none',
                        outlineOffset: '3px',
                        backgroundColor: 'white',
                      }}
                    >
                      <CardPreview card={card} />

                      {/* 스와이프 힌트 (첫 카드에만, 미스와이프 상태일 때) */}
                      {!isSwiped && (
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center opacity-30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 스와이프 안내 텍스트 */}
              <p className="mt-2 text-center text-xs text-text-tertiary">
                카드를 왼쪽으로 밀어 삭제
              </p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
