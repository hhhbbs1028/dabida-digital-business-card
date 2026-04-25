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
import type { CardTheme, CardContentTokens, CardElementPositions, ElementPosition, StickerElement } from '../../theme/types';
import { applyThemeToStyle } from '../../theme/applyTheme';
import { resolvePositions } from '../../theme/defaultPositions';
import { makeRenderHelpers } from '../../theme/renderHelpers';
import {
  TEXT_ELEMENTS,
  shouldRenderInEditing,
  resolveElementValue,
} from './cardElements';

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
  rotation?: number;
};

// 화면 포인터 좌표 → 카드 로컬 % 좌표 변환
// rotation=90(CW)일 때: 화면 X → 로컬 Y, 화면 Y → 로컬 X(반전)
function screenToLocal(clientX: number, clientY: number, rect: DOMRect, rotation: number) {
  if (rotation === 90) {
    return {
      x: (1 - (clientY - rect.top) / rect.height) * 100,
      y: ((clientX - rect.left) / rect.width) * 100,
    };
  }
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}

// 카드 로컬 % 좌표 → 화면 픽셀 좌표 변환 (리사이즈 핸들 거리 계산용)
function localToScreen(localX: number, localY: number, rect: DOMRect, rotation: number) {
  if (rotation === 90) {
    return {
      cx: rect.left + (localY / 100) * rect.width,
      cy: rect.top + (1 - localX / 100) * rect.height,
    };
  }
  return {
    cx: rect.left + (localX / 100) * rect.width,
    cy: rect.top + (localY / 100) * rect.height,
  };
}

function useDrag({ containerRef, onDragEnd, rotation = 0 }: UseDragOptions) {
  const dragging = useRef(false);
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // 클릭 지점과 요소 중심 사이의 오프셋 — 클릭 시 점프 방지
  const offsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const toRaw = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return screenToLocal(clientX, clientY, rect, rotation);
  }, [containerRef, rotation]);

  // elemX, elemY: 요소 중심의 현재 % 위치 (클릭 오프셋 계산용)
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, elemX: number, elemY: number) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    const ptr = toRaw(e.clientX, e.clientY);
    offsetRef.current = { dx: elemX - ptr.x, dy: elemY - ptr.y };
    posRef.current = { x: elemX, y: elemY };
  }, [toRaw]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>, onMove: (x: number, y: number) => void) => {
    if (!dragging.current) return;
    const ptr = toRaw(e.clientX, e.clientY);
    const x = Math.max(2, Math.min(98, ptr.x + offsetRef.current.dx));
    const y = Math.max(2, Math.min(98, ptr.y + offsetRef.current.dy));
    posRef.current = { x, y };
    onMove(x, y);
  }, [toRaw]);

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
  rotation?: number;
};

function DraggableElement({
  pos, containerRef, isSelected, label, onSelect, onMove, onMoveEnd, children,
  anchor = 'center', onFontScale, onFontScaleEnd, rotation = 0,
}: DraggableProps) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDrag({
    containerRef,
    onDragEnd: onMoveEnd,
    rotation,
  });

  const calcFontScale = useCallback((e: React.PointerEvent): number => {
    if (!containerRef.current) return pos.fontScale ?? 1;
    const rect = containerRef.current.getBoundingClientRect();
    const { cx, cy } = localToScreen(pos.x, pos.y, rect, rotation);
    const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
    return Math.max(0.5, Math.min(2.0, (dist / rect.width) * 10));
  }, [containerRef, pos.x, pos.y, pos.fontScale, rotation]);

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
      onPointerDown={(e) => { onSelect(); onPointerDown(e, pos.x, pos.y); }}
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
  rotation?: number;
};

function ProfileCanvas({
  pos, url, shape, containerRef, isSelected,
  onSelect, onMove, onMoveEnd, onResize, onResizeEnd, rotation = 0,
}: ProfileCanvasProps) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDrag({
    containerRef,
    onDragEnd: onMoveEnd,
    rotation,
  });

  const size = pos.size ?? 22;
  const shapeClass = shape === 'circle' ? '50%' : shape === 'rounded' ? '12px' : '0';

  const calcSize = (e: React.PointerEvent): number => {
    if (!containerRef.current) return size;
    const rect = containerRef.current.getBoundingClientRect();
    const { cx, cy } = localToScreen(pos.x, pos.y, rect, rotation);
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
      onPointerDown={(e) => { onSelect(); onPointerDown(e, pos.x, pos.y); }}
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
  canvasRotation?: number;
  /**
   * 카드 루트 div의 maxWidth를 재정의.
   * 기본값: portrait `'min(100%, 300px)'`, landscape `'min(100%, 540px)'`
   * — BusinessCard 절대 폭과 일치하여 cqw 기반 폰트가 모든 진입점에서 동일 비율을 유지.
   */
  maxWidthOverride?: string;
};

export function CardCanvas({ theme, data, onPositionsChange, onStickersChange, className, canvasRotation = 0, maxWidthOverride }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orientation = theme.orientation ?? 'landscape';
  const isPortrait = orientation === 'portrait';
  const hasProfile = !!data.profileUrl && theme.style.profileShape !== 'none';

  const [positions, setPositions] = useState<FullPositionMap>(
    () => resolvePositions(theme.elementPositions, theme.layoutId, orientation, hasProfile) as FullPositionMap,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerElement[]>(theme.stickers ?? []);
  // 스티커 드래그 클릭 오프셋 추적 (클릭 시 점프 방지)
  const stickerDragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

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

  // BusinessCard(정적 뷰)와 동일한 스타일 계산식을 공유하기 위해 renderHelpers를 사용.
  // 요소별 JSX는 cardElements.TEXT_ELEMENTS에서 정의하며, 편집 모드 플래그(isEditing=true)가
  // helpers에 전달되어 텍스트 자체의 pointerEvents가 제거된다.
  const helpers = makeRenderHelpers(isPortrait);

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
    rotation: canvasRotation,
  });

  return (
    <div
      className={`mx-auto w-full overflow-hidden rounded-2xl border shadow-md ${className ?? ''}`}
      style={{
        aspectRatio: isPortrait ? '5 / 9' : '9 / 5',
        maxWidth: maxWidthOverride ?? (isPortrait ? 'min(100%, 300px)' : 'min(100%, 540px)'),
        position: 'relative',
        // cqw 기반 폰트·아이콘 단위가 카드 폭을 참조하도록 컨테이너 쿼리 컨텍스트 형성.
        containerType: 'inline-size',
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
          rotation={canvasRotation}
        />
      )}

      {/* 텍스트 요소 — cardElements.TEXT_ELEMENTS의 단일 정의를 따름 */}
      {TEXT_ELEMENTS.map((def) => {
        if (!shouldRenderInEditing(def, data, selected)) return null;
        const elemPos = positions[def.key];
        const value = resolveElementValue(def, data, true);
        return (
          <DraggableElement key={def.key} {...textElemProps(def.key, def.label)}>
            {def.render({
              helpers,
              fontScale: elemPos.fontScale ?? 1,
              value,
              isEditing: true,
            })}
          </DraggableElement>
        );
      })}

      {/* 스티커 레이어 */}
      {stickers
        .slice()
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((sticker) => {
          const isSel = selected === sticker.id;

          const toStickerPos = (clientX: number, clientY: number) => {
            if (!containerRef.current) return { x: sticker.x, y: sticker.y };
            const rect = containerRef.current.getBoundingClientRect();
            const { x: ptrX, y: ptrY } = screenToLocal(clientX, clientY, rect, canvasRotation);
            return {
              x: Math.max(2, Math.min(98, ptrX + stickerDragOffset.current.dx)),
              y: Math.max(2, Math.min(98, ptrY + stickerDragOffset.current.dy)),
            };
          };
          const handleStickerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            setSelected(sticker.id);
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const { x: ptrX, y: ptrY } = screenToLocal(e.clientX, e.clientY, rect, canvasRotation);
              stickerDragOffset.current = { dx: sticker.x - ptrX, dy: sticker.y - ptrY };
            }
          };
          const handleStickerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const { x, y } = toStickerPos(e.clientX, e.clientY);
            updateSticker(sticker.id, { x, y });
          };
          const handleStickerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const { x, y } = toStickerPos(e.clientX, e.clientY);
            commitSticker(stickers.map((s) => s.id === sticker.id ? { ...s, x, y } : s));
          };

          const handleResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
          };
          const calcStickerWidth = (e: React.PointerEvent): number => {
            if (!containerRef.current) return sticker.width;
            const rect = containerRef.current.getBoundingClientRect();
            const { cx, cy } = localToScreen(sticker.x, sticker.y, rect, canvasRotation);
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
