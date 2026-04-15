/**
 * CardCanvas Component
 *
 * 명함 편집 캔버스 — 요소 드래그 위치 조정 기능
 *
 * 설계 원칙:
 * - 고정 비율 컨테이너 안에 모든 요소를 절대 위치로 렌더링
 * - 각 요소는 포인터 캡처를 이용한 드래그로 이동 가능
 * - 위치는 카드 너비/높이 대비 % 단위로 저장 (요소 중심점 기준)
 * - 뷰 모드는 BusinessCard가 담당; 이 컴포넌트는 에디터 전용
 */

import React, { useRef, useState, useCallback } from 'react';
import { Globe, HardDrive } from 'lucide-react';

// lucide-react에서 deprecated된 소셜 아이콘 → 인라인 SVG로 대체
const IgIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const GhIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);
const LiIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
import type { CardTheme, CardContentTokens, CardElementPositions, ElementPosition, StickerElement } from '../../theme/types';
import { applyThemeToStyle } from '../../theme/applyTheme';
import { resolvePositions } from '../../theme/defaultPositions';

// ============================================================================
// 위치 맵 타입
// ============================================================================

type FullPositionMap = {
  profile: ElementPosition;
  name: ElementPosition;
  tagline: ElementPosition;
  major: ElementPosition;
  contact: ElementPosition;
  links: ElementPosition;
  email: ElementPosition;
  phone: ElementPosition;
  instagram: ElementPosition;
  github: ElementPosition;
  website: ElementPosition;
  linkedin: ElementPosition;
  google_drive: ElementPosition;
};

// ============================================================================
// 드래그 훅
// ============================================================================

type UseDragOptions = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDragEnd: (x: number, y: number) => void;
};

function useDrag({ containerRef, onDragEnd }: UseDragOptions) {
  const dragging = useRef(false);
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const toPercent = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, [containerRef]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    posRef.current = toPercent(e.clientX, e.clientY);
  }, [toPercent]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>, onMove: (x: number, y: number) => void) => {
    if (!dragging.current) return;
    const pos = toPercent(e.clientX, e.clientY);
    posRef.current = pos;
    onMove(pos.x, pos.y);
  }, [toPercent]);

  const onPointerUp = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    onDragEnd(posRef.current.x, posRef.current.y);
  }, [onDragEnd]);

  return { onPointerDown, onPointerMove, onPointerUp };
}

// ============================================================================
// DraggableElement (텍스트용, 선택적 fontScale 리사이즈 핸들 포함)
// ============================================================================

type DraggableProps = {
  pos: ElementPosition;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  label: string;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onMoveEnd: (x: number, y: number) => void;
  children: React.ReactNode;
  anchor?: 'center' | 'top-left';
  onFontScale?: (scale: number) => void;
  onFontScaleEnd?: (scale: number) => void;
};

function DraggableElement({
  pos, containerRef, isSelected, label, onSelect, onMove, onMoveEnd, children,
  anchor = 'center', onFontScale, onFontScaleEnd,
}: DraggableProps) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDrag({
    containerRef,
    onDragEnd: onMoveEnd,
  });

  const calcFontScale = useCallback((e: React.PointerEvent): number => {
    if (!containerRef.current) return pos.fontScale ?? 1;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + (pos.x / 100) * rect.width;
    const cy = rect.top + (pos.y / 100) * rect.height;
    const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
    return Math.max(0.5, Math.min(2.0, (dist / rect.width) * 10));
  }, [containerRef, pos.x, pos.y, pos.fontScale]);

  const handleResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onFontScale?.(calcFontScale(e));
  };
  const handleResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onFontScaleEnd?.(calcFontScale(e));
  };

  return (
    <div
      onPointerDown={(e) => { onSelect(); onPointerDown(e); }}
      onPointerMove={(e) => onPointerMove(e, onMove)}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: anchor === 'center' ? 'translate(-50%, -50%)' : 'none',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        outline: isSelected
          ? '2px solid rgba(99,102,241,0.8)'
          : '1.5px dashed rgba(99,102,241,0.35)',
        outlineOffset: '3px',
        borderRadius: '4px',
        zIndex: pos.zIndex != null ? pos.zIndex + (isSelected ? 9999 : 0) : (isSelected ? 20 : 10),
        opacity: pos.opacity ?? 1,
        padding: '2px',
      }}
      title={`${label} — 드래그하여 이동`}
    >
      {children}

      {/* 선택 시 라벨 */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '-1.4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(99,102,241,0.9)',
          color: '#fff',
          fontSize: '0.6rem',
          fontWeight: 600,
          padding: '1px 6px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {label}
        </div>
      )}

      {/* fontScale 리사이즈 핸들 (텍스트 전용, 선택 시 표시) */}
      {isSelected && onFontScale && (
        <div
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '-6px',
            width: '10px',
            height: '10px',
            background: 'rgba(99,102,241,0.9)',
            border: '2px solid #fff',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            zIndex: 30,
            touchAction: 'none',
          }}
          title="크기 조절"
        />
      )}
    </div>
  );
}

// ============================================================================
// 프로필 이미지 (리사이즈 핸들 포함)
// ============================================================================

type ProfileCanvasProps = {
  pos: ElementPosition;
  url: string;
  shape: CardTheme['style']['profileShape'];
  containerRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onMoveEnd: (x: number, y: number) => void;
  onResize: (size: number) => void;
  onResizeEnd: (size: number) => void;
};

function ProfileCanvas({
  pos, url, shape, containerRef, isSelected,
  onSelect, onMove, onMoveEnd, onResize, onResizeEnd,
}: ProfileCanvasProps) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDrag({
    containerRef,
    onDragEnd: onMoveEnd,
  });

  const size = pos.size ?? 22;
  const shapeClass = shape === 'circle' ? '50%' : shape === 'rounded' ? '12px' : '0';

  const calcSize = (e: React.PointerEvent): number => {
    if (!containerRef.current) return size;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + (pos.x / 100) * rect.width;
    const cy = rect.top + (pos.y / 100) * rect.height;
    const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
    return Math.max(8, Math.min(60, (dist / rect.width) * 200));
  };

  const handleResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onResize(calcSize(e));
  };
  const handleResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onResizeEnd(calcSize(e));
  };

  return (
    <div
      onPointerDown={(e) => { onSelect(); onPointerDown(e); }}
      onPointerMove={(e) => onPointerMove(e, onMove)}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: `${size}%`,
        aspectRatio: '1',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        outline: isSelected
          ? '2px solid rgba(99,102,241,0.8)'
          : '1.5px dashed rgba(99,102,241,0.35)',
        outlineOffset: '3px',
        borderRadius: shapeClass,
        zIndex: pos.zIndex != null ? pos.zIndex + (isSelected ? 9999 : 0) : (isSelected ? 20 : 10),
        opacity: pos.opacity ?? 1,
      }}
      title="프로필 사진 — 드래그하여 이동"
    >
      <img
        src={url}
        alt="프로필"
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: shapeClass, display: 'block' }}
      />

      {isSelected && (
        <div style={{
          position: 'absolute', top: '-1.4rem', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(99,102,241,0.9)', color: '#fff',
          fontSize: '0.6rem', fontWeight: 600,
          padding: '1px 6px', borderRadius: '4px',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          사진
        </div>
      )}

      {isSelected && (
        <div
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          style={{
            position: 'absolute', bottom: '-6px', right: '-6px',
            width: '10px', height: '10px',
            background: 'rgba(99,102,241,0.9)', border: '2px solid #fff',
            borderRadius: '50%', cursor: 'nwse-resize', zIndex: 30, touchAction: 'none',
          }}
          title="크기 조절"
        />
      )}
    </div>
  );
}

// ============================================================================
// CardCanvas 메인
// ============================================================================

type Props = {
  theme: CardTheme;
  data: CardContentTokens;
  onPositionsChange?: (positions: CardElementPositions) => void;
  onStickersChange?: (stickers: StickerElement[]) => void;
  className?: string;
};

export function CardCanvas({ theme, data, onPositionsChange, onStickersChange, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orientation = theme.orientation ?? 'landscape';
  const isPortrait = orientation === 'portrait';
  const hasProfile = !!data.profileUrl && theme.style.profileShape !== 'none';

  const [positions, setPositions] = useState<FullPositionMap>(
    () => resolvePositions(theme.elementPositions, theme.layoutId, orientation, hasProfile) as FullPositionMap,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerElement[]>(theme.stickers ?? []);

  React.useEffect(() => {
    setPositions(resolvePositions(theme.elementPositions, theme.layoutId, orientation, hasProfile) as FullPositionMap);
  }, [theme.elementPositions, theme.layoutId, orientation, hasProfile]);

  React.useEffect(() => {
    setStickers(theme.stickers ?? []);
  }, [theme.stickers]);

  const commitSticker = useCallback((updated: StickerElement[]) => {
    setStickers(updated);
    onStickersChange?.(updated);
  }, [onStickersChange]);

  const updateSticker = useCallback((id: string, patch: Partial<StickerElement>) => {
    setStickers((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const deleteSticker = useCallback((id: string) => {
    const next = stickers.filter((s) => s.id !== id);
    setSelected(null);
    commitSticker(next);
  }, [stickers, commitSticker]);

  const updatePos = useCallback((key: keyof FullPositionMap, x: number, y: number) => {
    setPositions((prev) => ({ ...prev, [key]: { ...prev[key], x, y } }));
  }, []);

  const commitPos = useCallback((key: keyof FullPositionMap, x: number, y: number) => {
    setPositions((prev) => {
      const next = { ...prev, [key]: { ...prev[key], x, y } };
      onPositionsChange?.(next);
      return next;
    });
  }, [onPositionsChange]);

  const updateFontScale = useCallback((key: keyof FullPositionMap, fontScale: number) => {
    setPositions((prev) => ({ ...prev, [key]: { ...prev[key], fontScale } }));
  }, []);

  const commitFontScale = useCallback((key: keyof FullPositionMap, fontScale: number) => {
    setPositions((prev) => {
      const next = { ...prev, [key]: { ...prev[key], fontScale } };
      onPositionsChange?.(next);
      return next;
    });
  }, [onPositionsChange]);

  const updateSize = useCallback((key: 'profile', size: number) => {
    setPositions((prev) => ({ ...prev, [key]: { ...prev[key], size } }));
  }, []);

  const commitSize = useCallback((key: 'profile', size: number) => {
    setPositions((prev) => {
      const next = { ...prev, [key]: { ...prev[key], size } };
      onPositionsChange?.(next);
      return next;
    });
  }, [onPositionsChange]);

  const bgStyle = applyThemeToStyle(theme);

  const scaledFs = (base: string, baseP: string, scale = 1) =>
    `calc(${isPortrait ? baseP : base} * ${scale})`;

  const ts = (colorVar: string, fs: string, fsP?: string, scale = 1): React.CSSProperties => ({
    fontFamily: 'var(--card-body-font)',
    fontWeight: 'var(--card-body-weight)',
    color: `var(${colorVar})`,
    fontSize: scaledFs(fs, fsP ?? fs, scale),
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  });

  // 텍스트 DraggableElement의 공통 props 생성 헬퍼
  const textElemProps = (key: keyof FullPositionMap, label: string) => ({
    pos: positions[key],
    containerRef,
    isSelected: selected === key,
    label,
    onSelect: () => setSelected(key as string),
    onMove: (x: number, y: number) => updatePos(key, x, y),
    onMoveEnd: (x: number, y: number) => commitPos(key, x, y),
    onFontScale: (scale: number) => updateFontScale(key, scale),
    onFontScaleEnd: (scale: number) => commitFontScale(key, scale),
  });

  return (
    <div
      className={`mx-auto w-full overflow-hidden rounded-2xl border shadow-md ${className ?? ''}`}
      style={{
        aspectRatio: isPortrait ? '5 / 9' : '9 / 5',
        maxWidth: isPortrait ? '50%' : '75%',
        position: 'relative',
        ...bgStyle,
        borderColor: 'var(--card-border, #e2e8f0)',
      }}
      ref={containerRef}
      onPointerDown={(e) => {
        if (e.target === containerRef.current) setSelected(null);
      }}
    >
      {/* 안내 텍스트 */}
      <div style={{
        position: 'absolute', top: 4, left: 0, right: 0,
        textAlign: 'center', fontSize: '0.55rem',
        color: 'rgba(99,102,241,0.7)', pointerEvents: 'none',
        zIndex: 50, fontWeight: 600, letterSpacing: '0.02em',
      }}>
        요소를 클릭 후 드래그하여 위치 조정
      </div>

      {/* 프로필 사진 */}
      {hasProfile && (
        <ProfileCanvas
          pos={positions.profile}
          url={data.profileUrl!}
          shape={theme.style.profileShape}
          containerRef={containerRef}
          isSelected={selected === 'profile'}
          onSelect={() => setSelected('profile')}
          onMove={(x, y) => updatePos('profile', x, y)}
          onMoveEnd={(x, y) => commitPos('profile', x, y)}
          onResize={(size) => updateSize('profile', size)}
          onResizeEnd={(size) => commitSize('profile', size)}
        />
      )}

      {/* 이름 */}
      <DraggableElement {...textElemProps('name', '이름')}>
        <div style={{
          fontFamily: 'var(--card-title-font)',
          fontWeight: 'var(--card-title-weight)',
          color: 'var(--card-primary)',
          fontSize: scaledFs(isPortrait ? '1.3rem' : '1rem', '1.3rem', positions.name.fontScale ?? 1),
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {data.name || 'Your Name'}
        </div>
      </DraggableElement>

      {/* 한 줄 소개 */}
      {(data.tagline || selected === 'tagline') && (
        <DraggableElement {...textElemProps('tagline', '한 줄 소개')}>
          <div style={ts('--card-secondary', '0.7rem', '0.875rem', positions.tagline.fontScale ?? 1)}>
            {data.tagline || '(한 줄 소개)'}
          </div>
        </DraggableElement>
      )}

      {/* 소속 */}
      {(data.major || selected === 'major') && (
        <DraggableElement {...textElemProps('major', '소속')}>
          <div style={{
            ...ts('--card-accent', '0.6rem', '0.75rem', positions.major.fontScale ?? 1),
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {data.major || '(소속)'}
          </div>
        </DraggableElement>
      )}

      {/* 이메일 (개별) */}
      {(data.email || selected === 'email') && (
        <DraggableElement {...textElemProps('email', '이메일')}>
          <span style={ts('--card-text', '0.58rem', '0.7rem', positions.email.fontScale ?? 1)}>
            {data.email || '(이메일)'}
          </span>
        </DraggableElement>
      )}

      {/* 전화 (개별) */}
      {(data.phone || selected === 'phone') && (
        <DraggableElement {...textElemProps('phone', '전화')}>
          <span style={ts('--card-text', '0.58rem', '0.7rem', positions.phone.fontScale ?? 1)}>
            {data.phone || '(전화)'}
          </span>
        </DraggableElement>
      )}

      {/* 인스타그램 (개별) */}
      {(data.links?.instagram || selected === 'instagram') && (
        <DraggableElement {...textElemProps('instagram', '인스타')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-text', '0.58rem', '0.7rem', positions.instagram.fontScale ?? 1) }}>
            <IgIcon size={9} />{data.links?.instagram || '(인스타그램)'}
          </span>
        </DraggableElement>
      )}

      {/* 깃허브 (개별) */}
      {(data.links?.github || selected === 'github') && (
        <DraggableElement {...textElemProps('github', '깃허브')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-text', '0.58rem', '0.7rem', positions.github.fontScale ?? 1) }}>
            <GhIcon size={9} />{data.links?.github || '(깃허브)'}
          </span>
        </DraggableElement>
      )}

      {/* 웹사이트 (개별) */}
      {(data.links?.website || selected === 'website') && (
        <DraggableElement {...textElemProps('website', '웹사이트')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-text', '0.58rem', '0.7rem', positions.website.fontScale ?? 1) }}>
            <Globe size={9} />{data.links?.website || '(웹사이트)'}
          </span>
        </DraggableElement>
      )}

      {/* 링크드인 (개별) */}
      {(data.links?.linkedin || selected === 'linkedin') && (
        <DraggableElement {...textElemProps('linkedin', '링크드인')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-text', '0.58rem', '0.7rem', positions.linkedin.fontScale ?? 1) }}>
            <LiIcon size={9} />{data.links?.linkedin || '(링크드인)'}
          </span>
        </DraggableElement>
      )}

      {/* 구글 드라이브 (개별) */}
      {(data.links?.google_drive || selected === 'google_drive') && (
        <DraggableElement {...textElemProps('google_drive', '드라이브')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-text', '0.58rem', '0.7rem', positions.google_drive.fontScale ?? 1) }}>
            <HardDrive size={9} />{data.links?.google_drive || '(드라이브)'}
          </span>
        </DraggableElement>
      )}

      {/* 스티커 레이어 */}
      {stickers
        .slice()
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((sticker) => {
          const isSel = selected === sticker.id;

          const handleStickerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            setSelected(sticker.id);
          };
          const handleStickerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId) || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
            updateSticker(sticker.id, { x, y });
          };
          const handleStickerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId) || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
            commitSticker(stickers.map((s) => s.id === sticker.id ? { ...s, x, y } : s));
          };

          const handleResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
          };
          const calcStickerWidth = (e: React.PointerEvent): number => {
            if (!containerRef.current) return sticker.width;
            const rect = containerRef.current.getBoundingClientRect();
            const cx = rect.left + (sticker.x / 100) * rect.width;
            const cy = rect.top + (sticker.y / 100) * rect.height;
            const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
            return Math.max(5, Math.min(70, (dist / rect.width) * 200));
          };
          const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            updateSticker(sticker.id, { width: calcStickerWidth(e) });
          };
          const handleResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            commitSticker(stickers.map((s) => s.id === sticker.id ? { ...s, width: calcStickerWidth(e) } : s));
          };

          const calcRotation = (clientX: number, clientY: number): number => {
            if (!containerRef.current) return sticker.rotation;
            const rect = containerRef.current.getBoundingClientRect();
            const cx = rect.left + (sticker.x / 100) * rect.width;
            const cy = rect.top + (sticker.y / 100) * rect.height;
            return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
          };
          const handleRotateDown = (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
          };
          const handleRotateMove = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            updateSticker(sticker.id, { rotation: calcRotation(e.clientX, e.clientY) });
          };
          const handleRotateUp = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const rotation = calcRotation(e.clientX, e.clientY);
            commitSticker(stickers.map((s) => s.id === sticker.id ? { ...s, rotation } : s));
          };

          return (
            <div
              key={sticker.id}
              onPointerDown={handleStickerPointerDown}
              onPointerMove={handleStickerPointerMove}
              onPointerUp={handleStickerPointerUp}
              style={{
                position: 'absolute',
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                width: `${sticker.width}%`,
                aspectRatio: '1',
                containerType: 'inline-size',
                opacity: sticker.opacity,
                zIndex: 10 + sticker.zIndex,
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none',
                outline: isSel ? '2px solid rgba(99,102,241,0.8)' : 'none',
                outlineOffset: '2px',
                borderRadius: '4px',
              }}
            >
              {sticker.type === 'emoji' ? (
                <div style={{
                  fontSize: '80cqw', lineHeight: 1, textAlign: 'center',
                  pointerEvents: 'none', width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sticker.src}
                </div>
              ) : (
                <img src={sticker.src} alt="sticker" draggable={false}
                  style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />
              )}

              {/* 삭제 버튼 */}
              {isSel && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); deleteSticker(sticker.id); }}
                  style={{
                    position: 'absolute', top: '-10px', right: '-10px',
                    width: '16px', height: '16px',
                    background: 'rgba(239,68,68,0.9)', border: '2px solid #fff',
                    borderRadius: '50%', color: '#fff', fontSize: '0.55rem',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 40,
                  }}
                >✕</button>
              )}

              {/* 회전 핸들 (단순 점) */}
              {isSel && (
                <div
                  onPointerDown={handleRotateDown}
                  onPointerMove={handleRotateMove}
                  onPointerUp={handleRotateUp}
                  style={{
                    position: 'absolute', top: '-18px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '10px', height: '10px',
                    background: 'rgba(34,197,94,0.9)', border: '2px solid #fff',
                    borderRadius: '50%', cursor: 'grab', zIndex: 40,
                    touchAction: 'none', userSelect: 'none',
                  }}
                  title="드래그하여 회전"
                />
              )}

              {/* 리사이즈 핸들 (단순 점) */}
              {isSel && (
                <div
                  onPointerDown={handleResizeDown}
                  onPointerMove={handleResizeMove}
                  onPointerUp={handleResizeUp}
                  style={{
                    position: 'absolute', bottom: '-6px', right: '-6px',
                    width: '10px', height: '10px',
                    background: 'rgba(99,102,241,0.9)', border: '2px solid #fff',
                    borderRadius: '50%', cursor: 'nwse-resize', zIndex: 40,
                    touchAction: 'none',
                  }}
                />
              )}
            </div>
          );
        })}

      {/* 클릭 해제 영역 */}
      {selected && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 5 }}
          onPointerDown={() => setSelected(null)}
        />
      )}
    </div>
  );
}
