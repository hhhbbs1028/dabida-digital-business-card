import React from 'react';
import type { CardData } from '../types';

type Props = {
  cards: CardData[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function CardsList({ cards, selectedId, loading, error, onSelect, onDelete }: Props) {
  return (
    <aside>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            내 명함
          </h2>
          <p className="mt-1 text-[11px] text-slate-400">
            여러 개의 프로필 명함을 만들어두고 필요할 때 골라 쓰세요.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-slate-500">명함을 불러오는 중입니다...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-6 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              Card
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-900">
                아직 저장된 명함이 없어요
              </p>
              <p className="text-[11px] text-slate-500">
                오른쪽에서 첫 번째 명함을 만들어보세요.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {cards.map((card) => {
              const isActive = selectedId === card.id;
              return (
                <li key={card.id}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(card.id)}
                      className={[
                        'flex w-full flex-1 items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs shadow-sm transition',
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold">
                          {card.display_name || '이름 없음'}
                        </p>
                        <p
                          className={[
                            'truncate text-[11px]',
                            isActive ? 'text-slate-100/80' : 'text-slate-500',
                          ].join(' ')}
                        >
                          {card.headline || card.organization || '설명 없음'}
                        </p>
                      </div>
                      <span
                        className={[
                          'ml-3 inline-flex h-6 min-w-[52px] items-center justify-center rounded-full border px-2 text-[10px] font-medium',
                          isActive
                            ? 'border-white/30 bg-white/10 text-slate-50'
                            : 'border-slate-200 bg-slate-50 text-slate-500',
                        ].join(' ')}
                      >
                        {isActive ? '편집 중' : '열기'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(card.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[11px] text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

