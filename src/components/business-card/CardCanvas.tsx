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
import { Instagram, Github, Globe } from 'lucide-react';
import type { CardTheme, CardContentTokens, CardElementPositions, ElementPosition, LayoutId, CardOrientation, StickerElement } from '../../theme/types';
import { applyThemeToStyle } from '../../theme/applyTheme';

// ============================================================================
// 기본 위치 테이블
// ============================================================================

type DefaultPositionMap = {
  profile: ElementPosition;
  name: ElementPosition;
  tagline: ElementPosition;
  major: ElementPosition;
  contact: ElementPosition;
  links: ElementPosition;
};

function getDefaultPositions(layoutId: LayoutId, orientation: CardOrientation, hasProfile: boolean): DefaultPositionMap {
  if (orientation === 'portrait') {
    return {
      profile: { x: 50, y: 18, size: 28 },
      name:    { x: 50, y: hasProfile ? 42 : 28 },
      tagline: { x: 50, y: hasProfile ? 53 : 40 },
      major:   { x: 50, y: hasProfile ? 63 : 52 },
      contact: { x: 50, y: hasProfile ? 73 : 65 },
      links:   { x: 50, y: hasProfile ? 83 : 78 },
    };
  }

  // landscape
  if (layoutId === 'split_01') {
    return {
      profile: { x: 13, y: 38, size: 22 },
      major:   { x: 13, y: 72 },
      name:    { x: 58, y: 28 },
      tagline: { x: 58, y: 48 },
      contact: { x: 58, y: 66 },
      links:   { x: 58, y: 82 },
    };
  }

  // minimal_01 landscape
  if (hasProfile) {
    return {
      profile: { x: 13, y: 50, size: 22 },
      name:    { x: 56, y: 25 },
      tagline: { x: 56, y: 44 },
      major:   { x: 56, y: 58 },
      contact: { x: 56, y: 72 },
      links:   { x: 56, y: 85 },
    };
  }
  return {
    profile: { x: 50, y: 50, size: 22 },
    name:    { x: 50, y: 25 },
    tagline: { x: 50, y: 44 },
    major:   { x: 50, y: 58 },
    contact: { x: 50, y: 72 },
    links:   { x: 50, y: 85 },
  };
}

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
    const pos = toPercent(e.clientX, e.clientY);
    posRef.current = pos;
  }, [toPercent]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>, onMove: (x: number, y: number) => void) => {
    if (!dragging.current) return;
    const pos = toPercent(e.clientX, e.clientY);
    posRef.current = pos;
    onMove(pos.x, pos.y);
  }, [toPercent]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    onDragEnd(posRef.current.x, posRef.current.y);
  }, [onDragEnd]);

  return { onPointerDown, onPointerMove, onPointerUp };
}

// ============================================================================
// DraggableElement
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
  /** 요소 앵커: 기본 center. 이미지는 center 사용 */
  anchor?: 'center' | 'top-left';
};

function DraggableElement({
  pos, containerRef, isSelected, label, onSelect, onMove, onMoveEnd, children, anchor = 'center',
}: DraggableProps) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDrag({
    containerRef,
    onDragEnd: onMoveEnd,
  });

  const transform = anchor === 'center' ? 'translate(-50%, -50%)' : 'none';

  return (
    <div
      onPointerDown={(e) => {
        onSelect();
        onPointerDown(e);
      }}
      onPointerMove={(e) => onPointerMove(e, onMove)}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform,
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
        <div
          style={{
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
          }}
        >
          {label}
        </div>
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

  // 리사이즈: 핸들 드래그 → 컨테이너 기준 거리로 size 계산
  const resizeDragging = useRef(false);
  const handleResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeDragging.current = true;
  };
  const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // 이미지 중심에서 포인터까지의 거리 → size
    const cx = rect.left + (pos.x / 100) * rect.width;
    const cy = rect.top + (pos.y / 100) * rect.height;
    const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
    const newSize = Math.max(8, Math.min(60, (dist / rect.width) * 200));
    onResize(newSize);
  };
  const handleResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeDragging.current) return;
    resizeDragging.current = false;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + (pos.x / 100) * rect.width;
    const cy = rect.top + (pos.y / 100) * rect.height;
    const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
    const newSize = Math.max(8, Math.min(60, (dist / rect.width) * 200));
    onResizeEnd(newSize);
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
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: shapeClass,
          display: 'block',
        }}
      />

      {/* 선택 시 라벨 */}
      {isSelected && (
        <div
          style={{
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
          }}
        >
          사진
        </div>
      )}

      {/* 리사이즈 핸들 */}
      {isSelected && (
        <div
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '-6px',
            width: '14px',
            height: '14px',
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
// CardCanvas 메인
// ============================================================================

type Props = {
  theme: CardTheme;
  data: CardContentTokens;
  /** 위치가 바뀔 때마다 호출 (실시간 미리보기용) */
  onPositionsChange?: (positions: CardElementPositions) => void;
  /** 스티커 변경 시 호출 */
  onStickersChange?: (stickers: StickerElement[]) => void;
  className?: string;
};

export function CardCanvas({ theme, data, onPositionsChange, onStickersChange, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orientation = theme.orientation ?? 'landscape';
  const isPortrait = orientation === 'portrait';
  const hasProfile = !!data.profileUrl && theme.style.profileShape !== 'none';

  // 기본 위치 + 저장된 위치 병합
  const defaults = getDefaultPositions(theme.layoutId, orientation, hasProfile);
  const saved = theme.elementPositions ?? {};

  const [positions, setPositions] = useState<DefaultPositionMap>(() => ({
    profile: { ...defaults.profile, ...saved.profile },
    name:    { ...defaults.name,    ...saved.name    },
    tagline: { ...defaults.tagline, ...saved.tagline },
    major:   { ...defaults.major,   ...saved.major   },
    contact: { ...defaults.contact, ...saved.contact },
    links:   { ...defaults.links,   ...saved.links   },
  }));

  // selected: 텍스트 요소 키 또는 스티커 ID
  const [selected, setSelected] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerElement[]>(theme.stickers ?? []);

  // theme.elementPositions 외부 변경 시 동기화 (위치 초기화 등)
  React.useEffect(() => {
    const newSaved = theme.elementPositions ?? {};
    const newDefaults = getDefaultPositions(theme.layoutId, orientation, hasProfile);
    setPositions({
      profile: { ...newDefaults.profile, ...newSaved.profile },
      name:    { ...newDefaults.name,    ...newSaved.name    },
      tagline: { ...newDefaults.tagline, ...newSaved.tagline },
      major:   { ...newDefaults.major,   ...newSaved.major   },
      contact: { ...newDefaults.contact, ...newSaved.contact },
      links:   { ...newDefaults.links,   ...newSaved.links   },
    });
  }, [theme.elementPositions, theme.layoutId, orientation, hasProfile]);

  // theme.stickers 외부 변경 시 동기화
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

  const updatePos = useCallback((key: keyof DefaultPositionMap, x: number, y: number) => {
    setPositions((prev) => {
      const next = { ...prev, [key]: { ...prev[key], x, y } };
      return next;
    });
  }, []);

  const commitPos = useCallback((key: keyof DefaultPositionMap, x: number, y: number) => {
    setPositions((prev) => {
      const next = { ...prev, [key]: { ...prev[key], x, y } };
      onPositionsChange?.({
        profile: next.profile,
        name: next.name,
        tagline: next.tagline,
        major: next.major,
        contact: next.contact,
        links: next.links,
      });
      return next;
    });
  }, [onPositionsChange]);

  const updateSize = useCallback((key: 'profile', size: number) => {
    setPositions((prev) => ({ ...prev, [key]: { ...prev[key], size } }));
  }, []);

  const commitSize = useCallback((key: 'profile', size: number) => {
    setPositions((prev) => {
      const next = { ...prev, [key]: { ...prev[key], size } };
      onPositionsChange?.({
        profile: next.profile,
        name: next.name,
        tagline: next.tagline,
        major: next.major,
        contact: next.contact,
        links: next.links,
      });
      return next;
    });
  }, [onPositionsChange]);

  const bgStyle = applyThemeToStyle(theme);

  const scaledFontSize = (base: string, scale: number) =>
    scale === 1 ? base : `calc(${base} * ${scale})`;

  const textStyle = (colorVar: string, fontSize: string, fontSizePortrait?: string, scale = 1) => ({
    fontFamily: 'var(--card-body-font)',
    fontWeight: 'var(--card-body-weight)',
    color: `var(${colorVar})`,
    fontSize: scaledFontSize(isPortrait ? (fontSizePortrait ?? fontSize) : fontSize, scale),
    whiteSpace: 'nowrap' as const,
    pointerEvents: 'none' as const,
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
        // 빈 곳 클릭 시 선택 해제
        if (e.target === containerRef.current) setSelected(null);
      }}
    >
      {/* ── 안내 텍스트 ── */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '0.55rem',
          color: 'rgba(99,102,241,0.7)',
          pointerEvents: 'none',
          zIndex: 50,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        요소를 클릭 후 드래그하여 위치 조정
      </div>

      {/* ── 프로필 사진 ── */}
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

      {/* ── 이름 ── */}
      <DraggableElement
        pos={positions.name}
        containerRef={containerRef}
        isSelected={selected === 'name'}
        label="이름"
        onSelect={() => setSelected('name')}
        onMove={(x, y) => updatePos('name', x, y)}
        onMoveEnd={(x, y) => commitPos('name', x, y)}
      >
        <div style={{
          fontFamily: 'var(--card-title-font)',
          fontWeight: 'var(--card-title-weight)',
          color: 'var(--card-primary)',
          fontSize: scaledFontSize(isPortrait ? '1.3rem' : '1rem', positions.name.fontScale ?? 1),
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {data.name || 'Your Name'}
        </div>
      </DraggableElement>

      {/* ── 한 줄 소개 ── */}
      {(data.tagline || selected === 'tagline') && (
        <DraggableElement
          pos={positions.tagline}
          containerRef={containerRef}
          isSelected={selected === 'tagline'}
          label="한 줄 소개"
          onSelect={() => setSelected('tagline')}
          onMove={(x, y) => updatePos('tagline', x, y)}
          onMoveEnd={(x, y) => commitPos('tagline', x, y)}
        >
          <div style={textStyle('--card-secondary', '0.7rem', '0.875rem', positions.tagline.fontScale ?? 1)}>
            {data.tagline || '(한 줄 소개)'}
          </div>
        </DraggableElement>
      )}

      {/* ── 소속 ── */}
      {(data.major || selected === 'major') && (
        <DraggableElement
          pos={positions.major}
          containerRef={containerRef}
          isSelected={selected === 'major'}
          label="소속"
          onSelect={() => setSelected('major')}
          onMove={(x, y) => updatePos('major', x, y)}
          onMoveEnd={(x, y) => commitPos('major', x, y)}
        >
          <div style={{
            ...textStyle('--card-accent', '0.6rem', '0.75rem', positions.major.fontScale ?? 1),
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {data.major || '(소속)'}
          </div>
        </DraggableElement>
      )}

      {/* ── 연락처 (이메일 + 전화) ── */}
      {(data.email || data.phone || selected === 'contact') && (
        <DraggableElement
          pos={positions.contact}
          containerRef={containerRef}
          isSelected={selected === 'contact'}
          label="연락처"
          onSelect={() => setSelected('contact')}
          onMove={(x, y) => updatePos('contact', x, y)}
          onMoveEnd={(x, y) => commitPos('contact', x, y)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', pointerEvents: 'none' }}>
            {data.email && (
              <span style={textStyle('--card-text', '0.58rem', '0.7rem', positions.contact.fontScale ?? 1)}>{data.email}</span>
            )}
            {data.phone && (
              <span style={textStyle('--card-text', '0.58rem', '0.7rem', positions.contact.fontScale ?? 1)}>{data.phone}</span>
            )}
            {!data.email && !data.phone && (
              <span style={textStyle('--card-text', '0.58rem', '0.7rem', positions.contact.fontScale ?? 1)}>(연락처)</span>
            )}
          </div>
        </DraggableElement>
      )}

      {/* ── 링크 ── */}
      {((data.links?.instagram || data.links?.github || data.links?.website) || selected === 'links') && (
        <DraggableElement
          pos={positions.links}
          containerRef={containerRef}
          isSelected={selected === 'links'}
          label="링크"
          onSelect={() => setSelected('links')}
          onMove={(x, y) => updatePos('links', x, y)}
          onMoveEnd={(x, y) => commitPos('links', x, y)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', pointerEvents: 'none' }}>
            {data.links?.instagram && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...textStyle('--card-text', '0.58rem', '0.7rem', positions.links.fontScale ?? 1) }}>
                <Instagram size={9} />{data.links.instagram}
              </span>
            )}
            {data.links?.github && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...textStyle('--card-text', '0.58rem', '0.7rem', positions.links.fontScale ?? 1) }}>
                <Github size={9} />{data.links.github}
              </span>
            )}
            {data.links?.website && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...textStyle('--card-text', '0.58rem', '0.7rem', positions.links.fontScale ?? 1) }}>
                <Globe size={9} />{data.links.website}
              </span>
            )}
            {!data.links?.instagram && !data.links?.github && !data.links?.website && (
              <span style={textStyle('--card-text', '0.58rem', '0.7rem', positions.links.fontScale ?? 1)}>(링크)</span>
            )}
          </div>
        </DraggableElement>
      )}

      {/* ── 스티커 레이어 ── */}
      {stickers
        .slice()
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((sticker) => {
          const isSel = selected === sticker.id;
          // 스티커용 드래그: pointerCapture 방식
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

          // 리사이즈 핸들
          const resizeDragging = { current: false };
          const handleResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            resizeDragging.current = true;
          };
          const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId) || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const cx = rect.left + (sticker.x / 100) * rect.width;
            const cy = rect.top + (sticker.y / 100) * rect.height;
            const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
            const newW = Math.max(5, Math.min(70, (dist / rect.width) * 200));
            updateSticker(sticker.id, { width: newW });
          };
          const handleResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId) || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const cx = rect.left + (sticker.x / 100) * rect.width;
            const cy = rect.top + (sticker.y / 100) * rect.height;
            const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
            const newW = Math.max(5, Math.min(70, (dist / rect.width) * 200));
            commitSticker(stickers.map((s) => s.id === sticker.id ? { ...s, width: newW } : s));
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
                  fontSize: '80cqw',
                  lineHeight: 1,
                  textAlign: 'center',
                  pointerEvents: 'none',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {sticker.src}
                </div>
              ) : (
                <img
                  src={sticker.src}
                  alt="sticker"
                  draggable={false}
                  style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
                />
              )}

              {/* 선택 시 삭제 버튼 */}
              {isSel && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); deleteSticker(sticker.id); }}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '18px',
                    height: '18px',
                    background: 'rgba(239,68,68,0.9)',
                    border: '2px solid #fff',
                    borderRadius: '50%',
                    color: '#fff',
                    fontSize: '0.6rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 40,
                  }}
                >
                  ✕
                </button>
              )}

              {/* 선택 시 리사이즈 핸들 */}
              {isSel && (
                <div
                  onPointerDown={handleResizeDown}
                  onPointerMove={handleResizeMove}
                  onPointerUp={handleResizeUp}
                  style={{
                    position: 'absolute',
                    bottom: '-8px',
                    right: '-8px',
                    width: '14px',
                    height: '14px',
                    background: 'rgba(99,102,241,0.9)',
                    border: '2px solid #fff',
                    borderRadius: '50%',
                    cursor: 'nwse-resize',
                    zIndex: 40,
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
