import React, { useRef, useState } from 'react';
import type { CardData } from '../types';
import { CardPreview } from './CardPreview';

type Props = {
  cards: CardData[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onShare?: (id: string) => void;
};

const REVEAL = 72;

export function CardsList({
  cards,
  selectedId,
  loading,
  error,
  onSelect,
  onDelete,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  const startXRef = useRef(0);
  const didDragRef = useRef(false);

  function getOffset(id: string) {
    if (drag?.id === id) return drag.offset;
    if (openId === id) return -REVEAL;
    return 0;
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    didDragRef.current = false;
    const startOffset = openId === id ? -REVEAL : 0;
    setDrag({ id, offset: startOffset });
  }

  function onPointerMove(e: React.PointerEvent, id: string) {
    if (!drag || drag.id !== id) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 4) didDragRef.current = true;
    const base = openId === id ? -REVEAL : 0;
    const offset = Math.min(0, Math.max(-REVEAL, base + delta));
    setDrag({ id, offset });
  }

  function onPointerUp(_e: React.PointerEvent, id: string) {
    if (!drag || drag.id !== id) return;
    if (drag.offset < -REVEAL / 2) {
      setOpenId(id);
    } else {
      setOpenId(null);
    }
    setDrag(null);
  }

  function handleCardClick(id: string) {
    if (didDragRef.current) return;
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(null);
    onSelect(id);
  }

  return (
    <aside>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-text-primary">내 명함</h2>
      </div>

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
            💳
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-text-primary">아직 저장된 명함이 없어요</p>
            <p className="text-xs text-text-tertiary">오른쪽에서 첫 번째 명함을 만들어보세요.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4" onClick={() => setOpenId(null)}>
          {cards.map((card) => {
            const isActive = selectedId === card.id;
            const offset = getOffset(card.id);
            const isAnimating = drag?.id !== card.id;

            return (
              <div
                key={card.id}
                className="relative overflow-hidden rounded-2xl"
                style={{ touchAction: 'pan-y' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 삭제 버튼 (왼쪽 스와이프 시 노출) */}
                <div
                  className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-2xl bg-red-500"
                  style={{ width: REVEAL }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(null);
                      onDelete(card.id);
                    }}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-white"
                    aria-label="명함 삭제"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span className="text-[10px] font-medium">삭제</span>
                  </button>
                </div>

                {/* 카드 콘텐츠 (스와이프 가능) */}
                <div
                  style={{
                    transform: `translateX(${offset}px)`,
                    transition: isAnimating ? 'transform 0.2s ease' : 'none',
                    position: 'relative',
                    zIndex: 1,
                  }}
                  onPointerDown={(e) => onPointerDown(e, card.id)}
                  onPointerMove={(e) => onPointerMove(e, card.id)}
                  onPointerUp={(e) => onPointerUp(e, card.id)}
                  onClick={() => handleCardClick(card.id)}
                >
                  <div
                    className={[
                      'relative w-full cursor-pointer text-left transition-all',
                      isActive
                        ? 'ring-2 ring-slate-900 ring-offset-2 rounded-2xl'
                        : 'opacity-90 hover:opacity-100',
                    ].join(' ')}
                  >
                    <CardPreview card={card} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
