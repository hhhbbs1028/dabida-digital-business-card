import React from 'react';
import type { CardData } from '../types';

type Props = {
  cards: CardData[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onShare?: (id: string) => void;
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

export function CardsList({
  cards,
  selectedId,
  loading,
  error,
  onSelect,
  onDelete,
  onShare,
}: Props) {
  return (
    <aside>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-text-primary">내 명함</h2>
      </div>

      <div className="rounded-toss-xl bg-bg-white p-4">
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
              <p className="text-sm font-bold text-text-primary">
                아직 저장된 명함이 없어요
              </p>
              <p className="text-xs text-text-tertiary">
                오른쪽에서 첫 번째 명함을 만들어보세요.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {cards.map((card) => {
              const isActive = selectedId === card.id;
              const displayName = card.display_name || '이름 없음';
              const initials = getInitials(displayName);
              const secondary =
                card.headline || card.organization || '설명 없음';
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(card.id)}
                    className={[
                      'flex min-h-[72px] w-full items-center gap-4 px-4 py-4 text-left transition-all touch-manipulation',
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
                      {/* Primary: 이름 - 1줄 ellipsis 강제 */}
                      <p className={[
                        'truncate text-base font-bold leading-tight',
                        isActive ? 'text-primary-500' : 'text-text-primary',
                      ].join(' ')}>
                        {displayName}
                      </p>
                      {/* Secondary: 직무/한 줄 소개 - 1줄 ellipsis 강제 */}
                      <p className="mt-0.5 truncate text-sm leading-relaxed text-text-secondary">
                        {secondary}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

