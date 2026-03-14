import React from 'react';
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

export function CardsList({
  cards,
  selectedId,
  loading,
  error,
  onSelect,
}: Props) {
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
        <div className="space-y-4">
          {cards.map((card) => {
            const isActive = selectedId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect(card.id)}
                className={[
                  'relative w-full cursor-pointer text-left transition-all',
                  isActive ? 'ring-2 ring-slate-900 ring-offset-2 rounded-2xl' : 'opacity-90 hover:opacity-100',
                ].join(' ')}
                style={{ pointerEvents: 'auto' }}
              >
                <div style={{ pointerEvents: 'none' }}>
                  <CardPreview card={card} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
