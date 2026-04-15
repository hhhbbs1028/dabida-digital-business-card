/**
 * FullscreenCardEditor
 *
 * 전체화면 명함 편집기 — 모바일 최적화
 * - 세로 명함: 일반 세로 레이아웃 (캔버스 상단, 바텀시트 하단)
 * - 가로 명함: 전체 UI를 90도 회전 → 핸드폰 가로모드처럼 표시
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Layers, Palette, Image as ImageBg } from 'lucide-react';
import { CardCanvas } from '../../../components/business-card/CardCanvas';
import type { CardTheme, CardContentTokens } from '../../../theme/types';
import { LayerPanel } from './editor-tabs/LayerPanel';
import { ColorTab } from './editor-tabs/ColorTab';
import { BackgroundTab } from './editor-tabs/BackgroundTab';

type BottomTabId = 'layer' | 'color' | 'background';

const BOTTOM_TABS: { id: BottomTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'layer',      label: '레이어', icon: <Layers size={20} />  },
  { id: 'color',      label: '색상',   icon: <Palette size={20} /> },
  { id: 'background', label: '배경',   icon: <ImageBg size={20} /> },
];

type Props = {
  theme: CardTheme;
  data: CardContentTokens;
  onThemeChange: (theme: CardTheme) => void;
  onClose: () => void;
};

export function FullscreenCardEditor({ theme: externalTheme, data, onThemeChange, onClose }: Props) {
  const [theme, setTheme] = useState<CardTheme>(externalTheme);
  const [activeTab, setActiveTab] = useState<BottomTabId | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const isLandscape = theme.orientation === 'landscape';

  // portrait: 바텀시트 최대 높이
  const sheetMaxHeight = '52vh';
  const sheetOpenPadding = '52vh';
  const sheetClosedPadding = '68px';
  // landscape: 사이드 시트 최대 너비 (내부 width = 화면 landscape height 기준)
  const landscapeSheetMaxW = '50vw';
  const canvasTopPadding = '52px';

  useEffect(() => {
    setTheme(externalTheme);
  }, [externalTheme]);

  const handleChange = (partial: Partial<CardTheme>) => {
    const next = { ...theme, ...partial };
    setTheme(next);
    onThemeChange(next);
  };

  const toggleTab = (id: BottomTabId) => {
    setActiveTab((prev) => (prev === id ? null : id));
  };

  const stickers = theme.stickers ?? [];

  useEffect(() => {
    if (activeTab && sheetRef.current) {
      sheetRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // ── 세로 명함: 일반 세로 레이아웃 (캔버스 상단, 탭바 하단) ─────────────────

  const portraitSheetContent = (
    <div
      ref={sheetRef}
      className="overflow-y-auto bg-white px-4 pb-4 pt-3"
      style={{
        maxHeight: activeTab ? sheetMaxHeight : 0,
        opacity: activeTab ? 1 : 0,
        transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
        overscrollBehavior: 'contain',
      }}
    >
      <div className="mb-3 flex justify-center">
        <div className="h-1 w-10 rounded-full bg-slate-200" />
      </div>
      {activeTab === 'layer' && (
        <LayerPanel theme={theme} stickers={stickers} data={data} onChange={handleChange} onClearStickers={() => handleChange({ stickers: [] })} />
      )}
      {activeTab === 'color' && <ColorTab theme={theme} onChange={handleChange} />}
      {activeTab === 'background' && <BackgroundTab theme={theme} onChange={handleChange} />}
    </div>
  );

  const portraitContent = (
    <div className="relative flex h-full w-full flex-col bg-black">
      {/* 닫기 버튼 — 우상단 */}
      <div className="absolute right-3 top-3 z-30">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          title="닫기"
        >
          <X size={18} />
        </button>
      </div>

      {/* 캔버스 영역 */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden px-4"
        style={{
          paddingTop: canvasTopPadding,
          paddingBottom: activeTab ? sheetOpenPadding : sheetClosedPadding,
          transition: 'padding-bottom 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="w-full max-w-2xl">
          <CardCanvas
            theme={theme}
            data={data}
            onPositionsChange={(positions) => handleChange({ elementPositions: positions })}
            onStickersChange={(newStickers) => handleChange({ stickers: newStickers })}
          />
        </div>
      </div>

      {/* 바텀 시트 + 탭바 (하단) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col">
        <div className="overflow-hidden rounded-t-2xl">{portraitSheetContent}</div>
        <div className="flex items-center border-t border-slate-800 bg-black">
          <div className="flex-1 px-4 py-2">
            <p className="text-[10px] text-slate-500">드래그하여 위치 조정</p>
          </div>
          <div className="flex">
            {BOTTOM_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => toggleTab(tab.id)}
                  className={['flex flex-col items-center gap-0.5 px-5 py-3 transition', isActive ? 'text-white' : 'text-slate-500'].join(' ')}
                >
                  {tab.icon}
                  <span className="text-[10px] font-medium">{tab.label}</span>
                  {isActive && <span className="block h-0.5 w-4 rounded-full bg-white" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ── 가로 명함: 90도 회전 레이아웃 ────────────────────────────────────────────
  // rotate(90deg) CW 좌표 변환: 내부 TOP→화면 RIGHT, 내부 RIGHT→화면 BOTTOM
  // → 탭바를 내부 RIGHT(flex-row 마지막)에 두면 화면 하단 수평 바로 표시

  // 내부 flex-row에서 오른쪽에 세로로 쌓인 탭 버튼 순서:
  // 내부 TOP(=화면 RIGHT) → 내부 BOTTOM(=화면 LEFT)
  // 화면에서 좌→우로 [레이어|색상|배경]이 되려면 내부에서 [배경,색상,레이어] 순
  const landscapeTabsOrdered = [...BOTTOM_TABS].reverse();

  const landscapeContent = (
    // paddingRight = env(safe-area-inset-bottom):
    // rotate(90deg) CW → 물리 화면 하단(nav bar) = 내부 RIGHT
    // 탭바가 내비게이션 바와 겹치지 않도록 우측에 safe area 여백 확보
    <div
      className="relative flex h-full w-full flex-row bg-black"
      style={{ paddingRight: 'env(safe-area-inset-bottom)' }}
    >
      {/* 닫기 버튼 — 내부 left-3 top-3 → 90도 CW 후 화면 우상단 (nav bar 안전 위치) */}
      <div className="absolute left-3 top-3 z-30">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          title="닫기"
        >
          <X size={18} />
        </button>
      </div>

      {/* 캔버스 영역 — flex-1, 나머지 공간 차지 */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden"
        style={{ padding: `${canvasTopPadding} 8px 8px 8px` }}
      >
        <div className="h-full w-full">
          <CardCanvas
            theme={theme}
            data={data}
            onPositionsChange={(positions) => handleChange({ elementPositions: positions })}
            onStickersChange={(newStickers) => handleChange({ stickers: newStickers })}
          />
        </div>
      </div>

      {/* 시트 패널 — 캔버스와 탭바 사이 (화면에서는 탭바 위에 위치) */}
      <div
        ref={sheetRef}
        className="flex-shrink-0 overflow-y-auto rounded-l-2xl bg-white"
        style={{
          width: activeTab ? landscapeSheetMaxW : 0,
          opacity: activeTab ? 1 : 0,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
          overscrollBehavior: 'contain',
        }}
      >
        {activeTab && (
          <div className="px-4 pb-4 pt-3">
            <div className="mb-3 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            {activeTab === 'layer' && (
              <LayerPanel theme={theme} stickers={stickers} data={data} onChange={handleChange} onClearStickers={() => handleChange({ stickers: [] })} />
            )}
            {activeTab === 'color' && <ColorTab theme={theme} onChange={handleChange} />}
            {activeTab === 'background' && <BackgroundTab theme={theme} onChange={handleChange} />}
          </div>
        )}
      </div>

      {/* 탭 바 — 내부 오른쪽(flex-row 마지막) → 90도 CW 후 화면 하단 수평 바 */}
      <div className="flex flex-col border-l border-slate-800 bg-black" style={{ width: '64px' }}>
        {landscapeTabsOrdered.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => toggleTab(tab.id)}
              className={[
                'flex flex-1 flex-col items-center justify-center gap-0.5 transition',
                isActive ? 'text-white' : 'text-slate-500',
              ].join(' ')}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && <span className="block h-0.5 w-4 rounded-full bg-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── 가로 명함: 90도 회전 컨테이너 ───────────────────────────────────────────

  if (isLandscape) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* 회전된 내부 컨테이너: width↔height 교환, 중심 기준 90도 회전 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vh',   // 회전 후 가로 = 화면 세로길이
            height: '100vw',  // 회전 후 세로 = 화면 가로길이
            transform: 'translate(-50%, -50%) rotate(90deg)',
          }}
        >
          {landscapeContent}
        </div>
      </div>
    );
  }

  // ── 세로 명함: 일반 세로 레이아웃 ───────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50">
      {portraitContent}
    </div>
  );
}
