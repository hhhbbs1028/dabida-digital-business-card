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
}: Props) {
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);

  return (
    <div className="flex-1">
      <div className="space-y-4">
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
              📇
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                아직 받은 명함이 없어요
              </p>
              <p className="text-xs text-slate-500">
                명함을 추가하면 여기에 표시됩니다.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => {
              const isActive = selectedId === card.id;
              const snapshot = card.snapshot;
              const displayName = snapshot.display_name || '이름 없음';
              const initials = getInitials(displayName);
              const isMenuOpen = menuOpenId === card.id;
              return (
                <li key={card.id} className="relative">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelect(card.id)}
                      className={[
                        'flex min-h-[92px] w-full flex-1 items-center gap-4 rounded-2xl bg-white px-4 py-4 text-left shadow-sm transition-all touch-manipulation',
                        isActive
                          ? 'ring-2 ring-primary-200'
                          : 'hover:shadow-md active:bg-slate-50',
                      ].join(' ')}
                    >
                      {/* 프로필 이니셜 */}
                      <div
                        className={[
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold',
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-700',
                        ].join(' ')}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Primary: 이름 - 1줄 ellipsis */}
                        <p className="truncate text-lg font-semibold leading-tight text-slate-900">
                          {displayName}
                        </p>
                        {/* Secondary: 직무/한 줄 소개 - 1줄 ellipsis */}
                        <p className="mt-1 truncate text-sm leading-relaxed text-slate-500">
                          {snapshot.headline || snapshot.organization || '설명 없음'}
                        </p>
                      </div>
                    </button>
                    {/* ⋯ 메뉴 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : card.id);
                      }}
                      className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 active:bg-slate-200 touch-manipulation"
                    >
                      ⋯
                    </button>
                  </div>
                  {/* 메뉴 드롭다운 */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-12 z-20 rounded-2xl bg-white p-2 shadow-lg">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(card.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full rounded-xl px-4 py-3 text-left text-base text-slate-700 transition hover:bg-slate-50"
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
                          className="w-full rounded-xl px-4 py-3 text-left text-base text-red-600 transition hover:bg-red-50"
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

