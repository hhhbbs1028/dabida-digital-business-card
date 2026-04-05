import { useRef, useState, useEffect } from 'react';
import type { CardData } from '../types';
import { BusinessCard } from '../../../components/business-card/BusinessCard';
import { storageToTheme, mergeTheme } from '../../../theme/mergeTheme';
import type { CardContentTokens } from '../../../theme/types';

const THUMB_W = 100;
const THUMB_H = 65;

function CardThumbnail({ card }: { card: CardData }) {
  if (!card.theme) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
    );
  }

  const isPortrait = card.theme.orientation === 'portrait';
  const RENDER_W = isPortrait ? 160 : 280;
  const RENDER_H = isPortrait ? (RENDER_W * 9) / 5 : (RENDER_W * 5) / 9;

  const scale = Math.min(THUMB_W / RENDER_W, THUMB_H / RENDER_H);
  const scaledW = RENDER_W * scale;
  const scaledH = RENDER_H * scale;
  const offsetX = (THUMB_W - scaledW) / 2;
  const offsetY = (THUMB_H - scaledH) / 2;

  const storage = card.theme as any;
  const theme = storage.colors ? storageToTheme(card.theme) : mergeTheme('minimal_light');

  const contentTokens: CardContentTokens = {
    name: card.display_name,
    major: card.organization,
    tagline: card.headline,
    email: card.email || undefined,
    phone: card.phone || undefined,
    links: {
      instagram: card.links.instagram || undefined,
      github: card.links.github || undefined,
      website: card.links.website || undefined,
    },
    logoUrl: card.logo_url || undefined,
    profileUrl: card.profile_url || undefined,
  };

  return (
    <div
      className="overflow-hidden"
      style={{ width: THUMB_W, height: THUMB_H, position: 'relative', flexShrink: 0 }}
    >
      <div
        style={{
          position: 'absolute',
          width: RENDER_W,
          height: RENDER_H,
          transformOrigin: 'top left',
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          pointerEvents: 'none',
        }}
      >
        <BusinessCard theme={theme} data={contentTokens} />
      </div>
    </div>
  );
}

type Props = {
  cards: CardData[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onDeleteDirect: (id: string) => void;
};

const SWIPE_THRESHOLD = 60;
const DELETE_REVEAL_WIDTH = 80;

export function CardsList({
  cards,
  selectedId,
  loading,
  error,
  onSelect,
  onDeleteDirect,
}: Props) {
  const [swipedCardId, setSwipedCardId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const isDragging = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenId]);

  function handleTouchStart(e: React.TouchEvent, cardId: string) {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = false;
    if (swipedCardId && swipedCardId !== cardId) setSwipedCardId(null);
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchCurrentX.current = e.touches[0].clientX;
    if (Math.abs(touchCurrentX.current - touchStartX.current) > 10) {
      isDragging.current = true;
    }
  }

  function handleTouchEnd(cardId: string) {
    const delta = touchCurrentX.current - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD) setSwipedCardId(cardId);
    else if (delta > 10) setSwipedCardId(null);
  }

  function handleCardClick(cardId: string) {
    if (isDragging.current) return;
    if (swipedCardId === cardId) { setSwipedCardId(null); return; }
    if (menuOpenId) { setMenuOpenId(null); return; }
    onSelect(cardId);
  }

  function handleDelete(e: React.MouseEvent, cardId: string) {
    e.stopPropagation();
    setMenuOpenId(null);
    setSwipedCardId(null);
    if (confirm('정말 삭제하시겠습니까?')) {
      onDeleteDirect(cardId);
    }
  }

  return (
    <aside>
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">내 명함</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {cards.length}
          </span>
        </div>
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
            <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white"
              style={{ boxShadow: '0 1px 8px 0 rgba(0,0,0,0.06)' }}>
              {cards.map((card, index) => {
                const isActive = selectedId === card.id;
                const isSwiped = swipedCardId === card.id;
                const isMenuOpen = menuOpenId === card.id;
                const isLast = index === cards.length - 1;

                return (
                  <div
                    key={card.id}
                    className="relative overflow-hidden"
                    style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}
                  >
                    {/* 스와이프 삭제 버튼 */}
                    <div
                      className="absolute inset-y-0 right-0 flex items-center justify-center"
                      style={{
                        width: DELETE_REVEAL_WIDTH,
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      }}
                    >
                      <button
                        onClick={(e) => handleDelete(e, card.id)}
                        className="flex h-full w-full flex-col items-center justify-center gap-1 text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-[11px] font-semibold">삭제</span>
                      </button>
                    </div>

                    {/* 카드 본체 */}
                    <div
                      onTouchStart={(e) => handleTouchStart(e, card.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() => handleTouchEnd(card.id)}
                      onClick={() => handleCardClick(card.id)}
                      className="relative flex w-full cursor-pointer items-center gap-3 bg-white px-3 py-3 transition-transform duration-200 active:bg-slate-50"
                      style={{
                        transform: isSwiped ? `translateX(-${DELETE_REVEAL_WIDTH}px)` : 'translateX(0)',
                        outline: isActive ? '2px solid #3182f6' : 'none',
                        outlineOffset: '-2px',
                      }}
                    >
                      {/* 왼쪽: 썸네일 */}
                      <div className="shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <CardThumbnail card={card} />
                      </div>

                      {/* 중앙: 텍스트 정보 */}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {card.display_name || '이름 없음'}
                        </p>
                        {card.organization && (
                          <p className="truncate text-xs text-slate-500">{card.organization}</p>
                        )}
                        {card.headline && (
                          <p className="truncate text-xs text-slate-400">{card.headline}</p>
                        )}
                      </div>

                      {/* 오른쪽: 케밥 메뉴 */}
                      <div className="relative shrink-0" ref={isMenuOpen ? menuRef : undefined}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(isMenuOpen ? null : card.id);
                            setSwipedCardId(null);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>

                        {/* 드롭다운 메뉴 */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-9 z-50 min-w-[110px] overflow-hidden rounded-xl border border-slate-100 bg-white"
                            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
                            <button
                              onClick={(e) => handleDelete(e, card.id)}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
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
