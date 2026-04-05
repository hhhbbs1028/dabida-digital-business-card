import { useRef, useState } from 'react';
import { Instagram, Github, Globe } from 'lucide-react';
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
  onShare: (id: string) => void;
};

const SWIPE_THRESHOLD = 60;
const REVEAL_WIDTH = 160; // 공유(80) + 삭제(80)

export function CardsList({
  cards,
  selectedId,
  loading,
  error,
  onSelect,
  onDeleteDirect,
  onShare,
}: Props) {
  const [swipedCardId, setSwipedCardId] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const isDragging = useRef(false);

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
    onSelect(cardId);
  }

  function handleDelete(e: React.MouseEvent, cardId: string) {
    e.stopPropagation();
    setSwipedCardId(null);
    if (confirm('정말 삭제하시겠습니까?')) {
      onDeleteDirect(cardId);
    }
  }

  function handleShare(e: React.MouseEvent, cardId: string) {
    e.stopPropagation();
    setSwipedCardId(null);
    onShare(cardId);
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
                const isLast = index === cards.length - 1;

                return (
                  <div
                    key={card.id}
                    className="relative overflow-hidden"
                    style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}
                  >
                    {/* 스와이프 액션 버튼: 공유 + 삭제 */}
                    <div
                      className="absolute inset-y-0 right-0 flex"
                      style={{ width: REVEAL_WIDTH }}
                    >
                      {/* 공유 버튼 */}
                      <button
                        onClick={(e) => handleShare(e, card.id)}
                        className="flex w-20 flex-col items-center justify-center gap-1 text-white"
                        style={{ background: 'linear-gradient(135deg, #3182f6 0%, #1e6ee6 100%)' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span className="text-[11px] font-semibold">공유</span>
                      </button>
                      {/* 삭제 버튼 */}
                      <button
                        onClick={(e) => handleDelete(e, card.id)}
                        className="flex w-20 flex-col items-center justify-center gap-1 text-white"
                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
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
                        transform: isSwiped ? `translateX(-${REVEAL_WIDTH}px)` : 'translateX(0)',
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
                        <div className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-slate-900">
                          <p className="truncate">{card.display_name || '이름 없음'}</p>
                          {card.organization && (
                            <p className="truncate text-xs text-slate-500">{card.organization}</p>
                          )}
                        </div>

                        {card.headline && (
                          <p className="truncate text-xs text-slate-500">{card.headline}</p>
                        )}

                        {(card.email || card.phone) && (
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-300">
                            {card.email && <p className="truncate">{card.email}</p>}
                            {card.email && card.phone && <span className="text-[10px] opacity-50">•</span>}
                            {card.phone && <p className="truncate">{card.phone}</p>}
                          </div>
                        )}

                        {(card.links?.instagram || card.links?.github || card.links?.website) && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {card.links.instagram && (
                              <span className="flex items-center gap-1 text-xs text-slate-300">
                                <Instagram size={11} />{card.links.instagram}
                              </span>
                            )}
                            {card.links.github && (
                              <span className="flex items-center gap-1 text-xs text-slate-300">
                                <Github size={11} />{card.links.github}
                              </span>
                            )}
                            {card.links.website && (
                              <span className="flex items-center gap-1 text-xs text-slate-300">
                                <Globe size={11} />{card.links.website}
                              </span>
                            )}
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
