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
  onDeleteDirect: (id: string) => void;
  onShare?: (id: string) => void;
};

const SWIPE_THRESHOLD = 90;       // px — 이 거리 넘으면 삭제 확정
const VELOCITY_THRESHOLD = 0.32;  // px/ms — 빠른 던지기 감지
const MAX_ROTATION = 22;          // degrees — 최대 회전각
const TAP_THRESHOLD = 10;         // px — 탭 / 스와이프 구분

type DragState = {
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  containerWidth: number;
  dir: 'none' | 'h' | 'v';
};

export function CardsList({
  cards,
  selectedId,
  loading,
  error,
  onSelect,
  onDeleteDirect,
}: Props) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [exitDir, setExitDir] = useState<'left' | 'right'>('left');

  const containerRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef<Array<{ x: number; t: number }>>([]);
  const didMoveRef = useRef(false);

  const topCard = cards[0] ?? null;

  /* ── velocity 계산 ── */
  function getVelocity(): number {
    const pts = velocityRef.current;
    if (pts.length < 2) return 0;
    const recent = pts.slice(-5);
    const dt = recent[recent.length - 1].t - recent[0].t;
    return dt < 10 ? 0 : (recent[recent.length - 1].x - recent[0].x) / dt;
  }

  /* ── 카드 날리기 ── */
  function triggerExit(id: string, dir: 'left' | 'right') {
    setExitingId(id);
    setExitDir(dir);
    setTimeout(() => {
      setExitingId(null);
      if (dir === 'left') onDeleteDirect(id);
    }, 300);
  }

  /* ── 포인터 이벤트 ── */
  function onPointerDown(e: React.PointerEvent) {
    if (!topCard || exitingId) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    velocityRef.current = [{ x: e.clientX, t: Date.now() }];
    didMoveRef.current = false;
    setDrag({
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      containerWidth: containerRef.current?.offsetWidth ?? 320,
      dir: 'none',
    });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    velocityRef.current.push({ x: e.clientX, t: Date.now() });
    if (velocityRef.current.length > 8) velocityRef.current.shift();

    const rawDx = e.clientX - drag.startX;
    const rawDy = e.clientY - drag.startY;
    let dir = drag.dir;

    // 방향 결정
    if (dir === 'none') {
      if (Math.abs(rawDx) >= TAP_THRESHOLD || Math.abs(rawDy) >= TAP_THRESHOLD) {
        dir = Math.abs(rawDx) >= Math.abs(rawDy) ? 'h' : 'v';
        if (dir === 'v') { setDrag(null); return; } // 수직 스크롤 → 취소
      }
    }
    if (dir !== 'h') { setDrag({ ...drag, dir }); return; }

    if (Math.abs(rawDx) > TAP_THRESHOLD) didMoveRef.current = true;
    setDrag({ ...drag, dx: rawDx, dy: rawDy * 0.2, dir: 'h' });
  }

  function onPointerUp() {
    if (!drag || !topCard) { setDrag(null); return; }
    const vel = getVelocity();
    const { dx } = drag;

    if (dx < -SWIPE_THRESHOLD || vel < -VELOCITY_THRESHOLD) {
      triggerExit(topCard.id, 'left'); // 왼쪽 → 삭제
    }
    // 오른쪽 스와이프는 spring 애니메이션으로 자연스럽게 복귀
    setDrag(null);
  }

  function handleCardClick() {
    if (didMoveRef.current || !topCard) return;
    onSelect(topCard.id);
  }

  /* ── 계산값 ── */
  const isDragging = drag?.dir === 'h';
  const dx = drag?.dx ?? 0;
  const dy = drag?.dy ?? 0;
  const containerWidth = drag?.containerWidth ?? 320;
  const absProgress = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1); // 0~1
  const rotation = (dx / containerWidth) * MAX_ROTATION;
  const isDeleteZone = dx < -(SWIPE_THRESHOLD * 0.45);
  const isKeepZone = dx > SWIPE_THRESHOLD * 0.45;

  /* ── 로딩 ── */
  if (loading) {
    return (
      <aside>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-text-primary">내 명함</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-secondary">명함을 불러오는 중입니다...</p>
        </div>
      </aside>
    );
  }

  /* ── 렌더 ── */
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

      {cards.length === 0 ? (
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
        /* ── 카드 스택 ── */
        <div
          ref={containerRef}
          className="relative select-none"
          style={{ paddingBottom: Math.min(cards.length - 1, 2) * 14 }}
        >
          {/* 뒤쪽 카드들 */}
          {cards.slice(1, 3).map((card, i) => {
            const depth = i + 1;
            const baseScale = 1 - depth * 0.05;
            const baseY = depth * 12;
            // 드래그 진행도에 따라 뒤 카드가 살짝 앞으로 올라옴
            const rise = isDragging ? Math.min(absProgress, 1) * 0.55 : 0;
            const scale = baseScale + (1 - baseScale) * rise;
            const translateY = baseY - baseY * rise;

            return (
              <div
                key={card.id}
                className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden rounded-2xl"
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  transformOrigin: 'top center',
                  transition: isDragging
                    ? 'none'
                    : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  zIndex: 10 - depth,
                  opacity: 1 - depth * 0.2,
                  filter: `brightness(${1 - depth * 0.07})`,
                  boxShadow: `0 ${2 + depth * 3}px ${8 + depth * 8}px rgba(0,0,0,${(0.07 + depth * 0.03).toFixed(2)})`,
                }}
              >
                <CardPreview card={card} />
              </div>
            );
          })}

          {/* 상단 카드 (인터랙티브) */}
          {topCard && (() => {
            const isExiting = exitingId === topCard.id;
            const isActive = selectedId === topCard.id;

            let transform: string;
            let transition: string;

            if (isExiting) {
              transform = exitDir === 'left'
                ? 'translateX(-160%) translateY(15px) rotate(-24deg)'
                : 'translateX(160%) translateY(15px) rotate(24deg)';
              transition = 'transform 0.28s cubic-bezier(0.55, 0, 1, 0.45), opacity 0.25s ease';
            } else if (isDragging) {
              transform = `translateX(${dx}px) translateY(${dy}px) rotate(${rotation}deg)`;
              transition = 'none';
            } else {
              transform = 'translateX(0px) translateY(0px) rotate(0deg)';
              transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            }

            return (
              <div
                className="relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
                style={{
                  transform,
                  transition,
                  opacity: isExiting ? 0 : 1,
                  zIndex: 20,
                  transformOrigin: 'center 75%',
                  outline: isActive ? '2px solid #0f172a' : 'none',
                  outlineOffset: '3px',
                  boxShadow: isDragging
                    ? '0 24px 60px rgba(0,0,0,0.26), 0 8px 20px rgba(0,0,0,0.16)'
                    : '0 8px 28px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.07)',
                  willChange: isDragging ? 'transform' : 'auto',
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setDrag(null)}
                onClick={handleCardClick}
              >
                {/* 삭제 오버레이 (왼쪽) */}
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-red-500"
                  style={{
                    opacity: isDeleteZone ? Math.min(absProgress * 2.2, 0.9) : 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.1s ease',
                  }}
                >
                  <div className="flex flex-col items-center gap-2 text-white drop-shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ width: 36, height: 36 }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-sm font-bold uppercase tracking-widest">Delete</span>
                  </div>
                </div>

                {/* 보관 오버레이 (오른쪽) */}
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-emerald-500"
                  style={{
                    opacity: isKeepZone ? Math.min(absProgress * 2.2, 0.9) : 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.1s ease',
                  }}
                >
                  <div className="flex flex-col items-center gap-2 text-white drop-shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ width: 36, height: 36 }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-bold uppercase tracking-widest">Keep</span>
                  </div>
                </div>

                {/* 카드 본문 */}
                <div style={{ pointerEvents: 'none' }}>
                  <CardPreview card={topCard} />
                </div>
              </div>
            );
          })()}

          {/* 인디케이터 & 힌트 */}
          <div className="mt-5 flex flex-col items-center gap-2">
            {/* 도트 인디케이터 */}
            <div className="flex items-center gap-1.5">
              {cards.slice(0, Math.min(cards.length, 7)).map((card, i) => (
                <div
                  key={card.id}
                  className={[
                    'rounded-full transition-all duration-300',
                    i === 0 ? 'h-2 w-5 bg-slate-700' : 'h-2 w-2 bg-slate-300',
                  ].join(' ')}
                />
              ))}
              {cards.length > 7 && (
                <span className="ml-1 text-xs text-slate-400">+{cards.length - 7}</span>
              )}
            </div>

            {/* 스와이프 힌트 */}
            {cards.length > 0 && (
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span>←</span>
                  <span className="text-red-400 font-medium">삭제</span>
                </span>
                <span className="text-slate-200">|</span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400 font-medium">탭</span>
                  <span>편집</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
