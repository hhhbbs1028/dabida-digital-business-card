/**
 * FullscreenCardEditor
 *
 * 전체화면 명함 편집기 — 모바일 최적화
 * - 세로 명함: 일반 세로 레이아웃 (캔버스 상단, 바텀시트 하단)
 * - 가로 명함: 네이티브 가로 레이아웃 (회전 없음, 캔버스 상단, 바텀시트 하단)
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
  // landscape: 가로 화면은 세로 공간이 좁으므로 더 작은 시트 높이 사용
  const landscapeSheetMaxHeight = '40vh';
  const landscapeSheetOpenPadding = '40vh';
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

  // ── 가로 명함: 네이티브 가로 레이아웃 ───────────────────────────────────────

  const landscapeSheetContent = (
    <div
      ref={sheetRef}
      className="overflow-y-auto bg-white px-4 pb-4 pt-3"
      style={{
        maxHeight: activeTab ? landscapeSheetMaxHeight : 0,
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

  if (isLandscape) {
    return (
      <div className="fixed inset-0 z-50">
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
              paddingBottom: activeTab ? landscapeSheetOpenPadding : sheetClosedPadding,
              transition: 'padding-bottom 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <div className="h-full w-full max-w-2xl">
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
            <div className="overflow-hidden rounded-t-2xl">{landscapeSheetContent}</div>
            <div className="flex items-center border-t border-slate-800 bg-black">
              <div className="flex-1 px-4 py-1.5">
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
                      className={['flex flex-col items-center gap-0.5 px-5 py-2 transition', isActive ? 'text-white' : 'text-slate-500'].join(' ')}
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
