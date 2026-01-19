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

// 이니셜 생성 함수
const getInitials = (name: string) => {
  if (!name) return '👤';
  const names = name.trim().split(/\s+/);
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function CardsList({ cards, selectedId, loading, error, onSelect, onDelete }: Props) {
  return (
    <aside>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">내 명함</h2>
          <p className="mt-1 text-xs text-slate-500">
            여러 개의 프로필 명함을 만들어두고 필요할 때 골라 쓰세요.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-slate-500">명함을 불러오는 중입니다...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-2xl">
              💳
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                아직 저장된 명함이 없어요
              </p>
              <p className="text-xs text-slate-500">
                오른쪽에서 첫 번째 명함을 만들어보세요.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => {
              const isActive = selectedId === card.id;
              const displayName = card.display_name || '이름 없음';
              const initials = getInitials(displayName);
              return (
                <li key={card.id}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelect(card.id)}
                      className={[
                        'flex min-h-[80px] w-full flex-1 items-center gap-4 rounded-2xl border px-5 py-4 text-left shadow-md transition-all touch-manipulation',
                        isActive
                          ? 'border-primary-500 bg-primary-50 text-slate-900 shadow-lg ring-2 ring-primary-200'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-primary-300 hover:shadow-lg active:bg-slate-50',
                      ].join(' ')}
                    >
                      {/* 프로필 이니셜 */}
                      <div
                        className={[
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold shadow-sm',
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-700',
                        ].join(' ')}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-900">
                          {displayName}
                        </p>
                        <p
                          className={[
                            'mt-0.5 text-sm',
                            isActive ? 'text-slate-600' : 'text-slate-500',
                          ].join(' ')}
                        >
                          {card.headline || card.organization || '설명 없음'}
                        </p>
                      </div>

                      <span
                        className={[
                          'ml-3 inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold',
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-600',
                        ].join(' ')}
                      >
                        {isActive ? '편집 중' : '열기'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(card.id)}
                      className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-200 text-base text-slate-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 active:bg-red-100 touch-manipulation"
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

