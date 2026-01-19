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
}: Props) {
  return (
    <div className="flex-1">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            받은 명함
          </h2>
          <p className="mt-1 text-[11px] text-slate-400">
            {cards.length}개의 명함이 저장되어 있습니다.
          </p>
        </div>
        {onSortChange && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500">정렬:</label>
            <select
              value={sortBy}
              onChange={(e) =>
                onSortChange(e.target.value as 'name' | 'newest' | 'oldest')
              }
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
            >
              <option value="newest">추가한 시간순</option>
              <option value="oldest">오래된 순</option>
              <option value="name">가나다순</option>
            </select>
          </div>
        )}
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
              📇
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-900">
                아직 받은 명함이 없어요
              </p>
              <p className="text-[11px] text-slate-500">
                명함을 추가하면 여기에 표시됩니다.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {cards.map((card) => {
              const isActive = selectedId === card.id;
              const snapshot = card.snapshot;
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
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">
                          {snapshot.display_name || '이름 없음'}
                        </p>
                        <p
                          className={[
                            'truncate text-[11px]',
                            isActive ? 'text-slate-100/80' : 'text-slate-500',
                          ].join(' ')}
                        >
                          {snapshot.headline || snapshot.organization || '설명 없음'}
                        </p>
                        {card.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {card.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className={[
                                  'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                  isActive
                                    ? 'bg-white/20 text-slate-50'
                                    : 'bg-slate-100 text-slate-600',
                                ].join(' ')}
                              >
                                {tag}
                              </span>
                            ))}
                            {card.tags.length > 3 && (
                              <span
                                className={[
                                  'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                  isActive
                                    ? 'bg-white/20 text-slate-50'
                                    : 'bg-slate-100 text-slate-600',
                                ].join(' ')}
                              >
                                +{card.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        {card.memo && (
                          <p
                            className={[
                              'mt-1 line-clamp-1 text-[10px]',
                              isActive ? 'text-slate-200/70' : 'text-slate-400',
                            ].join(' ')}
                          >
                            {card.memo}
                          </p>
                        )}
                      </div>
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
    </div>
  );
}

