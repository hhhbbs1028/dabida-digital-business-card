import { useRef, useState } from 'react';
import { Instagram, Github, Globe, Linkedin, HardDrive, Mail, Phone, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import type { CardData } from '../types';
import { BusinessCard } from '../../../components/business-card/BusinessCard';
import { storageToTheme, mergeTheme } from '../../../theme/mergeTheme';
import type { CardContentTokens } from '../../../theme/types';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { computeCardLevel } from '../levels/computeCardLevel';
import { CardLevelBadge } from './CardLevelBadge';

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
  // BusinessCard의 자연 maxWidth(portrait 300 / landscape 540)와 일치시켜
  // "풀 프리뷰 → 썸네일" 단일 단계 스케일만 남도록 한다. (이중 스케일 해소)
  const RENDER_W = isPortrait ? 300 : 540;
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
      linkedin: card.links.linkedin || undefined,
      google_drive: card.links.google_drive || undefined,
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

// ── 복사 필드 정의 ─────────────────────────────────────────────────────────────

type CopyFieldKey =
  | 'display_name' | 'headline' | 'organization'
  | 'email' | 'phone'
  | 'links.instagram' | 'links.github' | 'links.website'
  | 'links.linkedin' | 'links.google_drive'
  | 'profile_url';

const COPY_FIELD_LABELS: Record<CopyFieldKey, string> = {
  display_name: '이름',
  headline: '한 줄 소개',
  organization: '소속',
  email: '이메일',
  phone: '전화번호',
  'links.instagram': 'Instagram',
  'links.github': 'GitHub',
  'links.website': '웹사이트',
  'links.linkedin': 'LinkedIn',
  'links.google_drive': 'Google Drive',
  profile_url: '프로필 사진',
};

function getAvailableFields(card: CardData): CopyFieldKey[] {
  const all: CopyFieldKey[] = [
    'display_name', 'headline', 'organization',
    'email', 'phone',
    'links.instagram', 'links.github', 'links.website',
    'links.linkedin', 'links.google_drive',
    'profile_url',
  ];
  return all.filter((key) => {
    if (key === 'display_name') return !!card.display_name;
    if (key === 'headline') return !!card.headline;
    if (key === 'organization') return !!card.organization;
    if (key === 'email') return !!card.email;
    if (key === 'phone') return !!card.phone;
    if (key === 'links.instagram') return !!card.links.instagram;
    if (key === 'links.github') return !!card.links.github;
    if (key === 'links.website') return !!card.links.website;
    if (key === 'links.linkedin') return !!card.links.linkedin;
    if (key === 'links.google_drive') return !!card.links.google_drive;
    if (key === 'profile_url') return !!card.profile_url;
    return false;
  });
}

// 테마는 사용자가 선택할 수 없는 고정 항목으로, 항상 원본 카드의 테마를 그대로 복사한다.
function buildNewCard(base: CardData, selected: Set<CopyFieldKey>): Omit<CardData, 'id'> {
  return {
    display_name: selected.has('display_name') ? base.display_name : '',
    headline: selected.has('headline') ? base.headline : '',
    organization: selected.has('organization') ? base.organization : '',
    email: selected.has('email') ? base.email : '',
    phone: selected.has('phone') ? base.phone : '',
    links: {
      instagram: selected.has('links.instagram') ? base.links.instagram : '',
      github: selected.has('links.github') ? base.links.github : '',
      website: selected.has('links.website') ? base.links.website : '',
      linkedin: selected.has('links.linkedin') ? base.links.linkedin : '',
      google_drive: selected.has('links.google_drive') ? base.links.google_drive : '',
    },
    profile_url: selected.has('profile_url') ? base.profile_url : null,
    theme: base.theme,
  };
}

// ── Props ──────────────────────────────────────────────────────────────────────

type Props = {
  cards: CardData[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onDeleteDirect: (id: string) => void;
  onShare: (id: string) => void;
  onCreateFromCard: (card: Omit<CardData, 'id'>) => void;
};

const SWIPE_THRESHOLD = 60;
const REVEAL_WIDTH = 160;   // 공유(80) + 삭제(80)
const COPY_REVEAL_WIDTH = 80; // 새 명함 만들기(80)

export function CardsList({
  cards,
  selectedId,
  loading,
  error,
  onSelect,
  onDeleteDirect,
  onShare,
  onCreateFromCard,
}: Props) {
  const [swipedCardId, setSwipedCardId] = useState<string | null>(null);
  const [copySwipedCardId, setCopySwipedCardId] = useState<string | null>(null);
  const [copySheetCard, setCopySheetCard] = useState<CardData | null>(null);
  const [copyFields, setCopyFields] = useState<Set<CopyFieldKey>>(new Set());
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const isDragging = useRef(false);

  function handleTouchStart(e: React.TouchEvent, cardId: string) {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = false;
    if (swipedCardId && swipedCardId !== cardId) setSwipedCardId(null);
    if (copySwipedCardId && copySwipedCardId !== cardId) setCopySwipedCardId(null);
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchCurrentX.current = e.touches[0].clientX;
    if (Math.abs(touchCurrentX.current - touchStartX.current) > 10) {
      isDragging.current = true;
    }
  }

  function handleTouchEnd(cardId: string) {
    const delta = touchCurrentX.current - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD) {
      setSwipedCardId(cardId);
      setCopySwipedCardId(null);
    } else if (delta > SWIPE_THRESHOLD) {
      setCopySwipedCardId(cardId);
      setSwipedCardId(null);
    } else {
      setSwipedCardId(null);
      setCopySwipedCardId(null);
    }
  }

  function handleCardClick(cardId: string) {
    if (isDragging.current) return;
    if (swipedCardId === cardId) { setSwipedCardId(null); return; }
    if (copySwipedCardId === cardId) { setCopySwipedCardId(null); return; }
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

  function handleOpenCopySheet(e: React.MouseEvent, card: CardData) {
    e.stopPropagation();
    setCopySwipedCardId(null);
    const available = getAvailableFields(card);
    setCopyFields(new Set(available));
    setCopySheetCard(card);
  }

  function toggleCopyField(key: CopyFieldKey) {
    setCopyFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleCopyConfirm() {
    if (!copySheetCard) return;
    onCreateFromCard(buildNewCard(copySheetCard, copyFields));
    setCopySheetCard(null);
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

      {/* 슬라이드 안내 */}
      {cards.length > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ChevronRight size={12} /> 오른쪽: 바이브 생성
          </span>
          <span className="text-slate-200">|</span>
          <span className="flex items-center gap-1">
            <ChevronLeft size={12} /> 왼쪽: 공유·삭제
          </span>
        </div>
      )}

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
            <div className="py-2 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white"
              style={{ boxShadow: '0 1px 8px 0 rgba(0,0,0,0.06)' }}>
              {cards.map((card, index) => {
                const isActive = selectedId === card.id;
                const isSwiped = swipedCardId === card.id;
                const isCopySwiped = copySwipedCardId === card.id;
                const isLast = index === cards.length - 1;

                let translateX = 'translateX(0)';
                if (isSwiped) translateX = `translateX(-${REVEAL_WIDTH}px)`;
                if (isCopySwiped) translateX = `translateX(${COPY_REVEAL_WIDTH}px)`;

                return (
                  <div
                    key={card.id}
                    className="relative overflow-hidden"
                    style={{ borderBottom: isLast ? 'none' : '1px solid #CBD5E1' }}
                  >
                    {/* 왼쪽: 새 명함 만들기 버튼 (오른쪽 스와이프 시 노출) */}
                    <div
                      className="absolute inset-y-0 left-0 flex"
                      style={{ width: COPY_REVEAL_WIDTH, zIndex: 0 }}
                    >
                      <button
                        onClick={(e) => handleOpenCopySheet(e, card)}
                        className="flex w-20 flex-col items-center justify-center gap-1 text-white"
                        style={{ background: '#4caf8a' }}
                      >
                        <Copy size={18} />
                        <span className="text-[11px] font-semibold leading-tight text-center">바이브<br/>생성</span>
                      </button>
                    </div>

                    {/* 오른쪽: 공유 + 삭제 버튼 (왼쪽 스와이프 시 노출) */}
                    <div
                      className="absolute inset-y-0 right-0 flex"
                      style={{ width: REVEAL_WIDTH, zIndex: 0 }}
                    >
                      <button
                        onClick={(e) => handleShare(e, card.id)}
                        className="flex w-20 flex-col items-center justify-center gap-1 text-white"
                        style={{ background: '#5b8dd9' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span className="text-[11px] font-semibold">공유</span>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, card.id)}
                        className="flex w-20 flex-col items-center justify-center gap-1 text-white"
                        style={{ background: '#d9534f' }}
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
                      className="relative z-10 flex w-full cursor-pointer items-center gap-3 bg-white px-3 py-3 transition-transform duration-200 active:bg-slate-50"
                      style={{
                        transform: translateX,
                        boxShadow: isActive ? 'inset 0 0 0 2px #3182f6' : 'none',
                      }}
                    >
                      {/* 왼쪽: 썸네일 */}
                      <div className="shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <CardThumbnail card={card} />
                      </div>

                      {/* 중앙: 텍스트 정보 */}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-900">
                          <p className="truncate">{card.display_name || '이름 없음'}</p>
                          <CardLevelBadge level={computeCardLevel(card)} size="sm" />
                        </div>
                        
                        {card.organization && (
                          <p className="truncate text-xs text-slate-500">{card.organization}</p>
                        )}

                        {card.headline && (
                          <p className="truncate text-xs text-slate-500">{card.headline}</p>
                        )}

                        {(card.email || card.phone) && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {card.email && (
                              <span className="flex items-center gap-1 text-xs text-slate-300">
                                <Mail size={11} />{card.email}
                              </span>
                            )}
                            {card.phone && (
                              <span className="flex items-center gap-1 text-xs text-slate-300">
                                <Phone size={11} />{card.phone}
                              </span>
                            )}
                          </div>
                        )}

                        {(card.links?.instagram || card.links?.github || card.links?.website || card.links?.linkedin || card.links?.google_drive) && (
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
                            {card.links.linkedin && (
                              <span className="flex items-center gap-1 text-xs text-slate-300">
                                <Linkedin size={11} />{card.links.linkedin}
                              </span>
                            )}
                            {card.links.google_drive && (
                              <span className="flex items-center gap-1 text-xs text-slate-300">
                                <HardDrive size={11} />{card.links.google_drive}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 오른쪽: 스와이프 힌트 */}
                      <div className="shrink-0 text-slate-300 select-none">
                        <ChevronLeft size={16} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 명함 복사 Bottom Sheet */}
      <BottomSheet
        isOpen={!!copySheetCard}
        onClose={() => setCopySheetCard(null)}
        title="이 명함을 기준으로 새 명함 만들기"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">가져올 정보를 선택하세요. 체크 해제한 항목은 새 명함에 포함되지 않습니다.</p>

          <div className="space-y-2">
            {copySheetCard && getAvailableFields(copySheetCard).map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
              >
                <input
                  type="checkbox"
                  checked={copyFields.has(key)}
                  onChange={() => toggleCopyField(key)}
                  className="h-4 w-4 rounded accent-slate-900"
                />
                <span className="text-sm font-medium text-slate-700">{COPY_FIELD_LABELS[key]}</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyConfirm}
            disabled={copyFields.size === 0}
            className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            새 명함 만들기
          </button>
        </div>
      </BottomSheet>
    </aside>
  );
}
