/**
 * FullscreenCardEditor
 *
 * 전체화면 명함 편집기 — 모바일 최적화
 * - 세로 명함: 일반 세로 레이아웃 (캔버스 상단, 바텀시트 하단)
 * - 가로 명함 + 가로 뷰포트: 네이티브 가로 레이아웃 (우측 Tool Rail, 하단 옵션 패널)
 * - 가로 명함 + 세로 뷰포트: 세로 레이아웃 유지 + 카드만 CSS rotate(-90deg)로 회전 표시
 *   → 사용자가 기기를 실제로 회전하지 않아도 가로 형태로 자연스럽게 보임
 *   → Orientation API(screen.orientation.lock)는 WebView 호환성 이슈로 사용하지 않고
 *     CSS transform 기반 처리로 통일
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

// 뷰포트 가로/세로 실시간 추적 — resize / orientationchange 이벤트에 반응
function useViewportLandscape(): boolean {
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return isLandscape;
}

export function FullscreenCardEditor({ theme: externalTheme, data, onThemeChange, onClose }: Props) {
  const [theme, setTheme] = useState<CardTheme>(externalTheme);
  const [activeTab, setActiveTab] = useState<BottomTabId | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const isLandscape = theme.orientation === 'landscape';
  const isViewportLandscape = useViewportLandscape();

  // 가로 명함을 세로 뷰포트에서 볼 때만 CSS 회전 적용
  // (가로 뷰포트면 기기가 이미 가로이므로 회전 불필요)
  const needsCssRotation = isLandscape && !isViewportLandscape;

  // portrait: 바텀시트 최대 높이 / 캔버스 여백
  const sheetMaxHeight = '52vh';
  const sheetOpenPadding = '52vh';
  const sheetClosedPadding = '68px';
  const canvasTopPadding = '52px';
  const landscapeSheetMaxHeight = '28vh'; // landscape: 패널 높이 (가로 화면 세로 여백 절약)

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

  // ── 가로 명함 + 가로 뷰포트: 네이티브 가로 레이아웃 ───────────────────────────
  // 높이 기반 카드 사이징: width = min(100%, 가용높이 × 1.8)
  // 가용높이 = 100vh − 옵션패널(28vh, 열렸을 때)

  const TOOL_RAIL_WIDTH = 64; // px

  if (isLandscape && isViewportLandscape) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        {/* 상단: 캔버스 영역 + 우측 Tool Rail */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden p-2">
            <div
              style={{
                width: activeTab
                  ? 'min(100%, calc((100vh - 28vh) * 1.8))'
                  : 'min(100%, calc(100vh * 1.8))',
                aspectRatio: '9 / 5',
                flexShrink: 0,
                transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <CardCanvas
                theme={theme}
                data={data}
                onPositionsChange={(positions) => handleChange({ elementPositions: positions })}
                onStickersChange={(newStickers) => handleChange({ stickers: newStickers })}
                maxWidthOverride="100%"
              />
            </div>
          </div>

          {/* 우측 Tool Rail — 닫기 + 탭 버튼 수직 스택 */}
          <div
            className="flex shrink-0 flex-col items-center border-l border-slate-800 bg-black py-3"
            style={{ width: TOOL_RAIL_WIDTH }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              title="닫기"
            >
              <X size={18} />
            </button>
            <div className="flex-1" />
            <div className="flex flex-col items-center gap-1">
              {BOTTOM_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => toggleTab(tab.id)}
                    className={[
                      'flex w-12 flex-col items-center gap-0.5 rounded-lg py-2 transition',
                      isActive ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300',
                    ].join(' ')}
                  >
                    {tab.icon}
                    <span className="text-[10px] font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 하단 전체 너비 옵션 패널 */}
        <div
          className="shrink-0 overflow-hidden rounded-t-2xl bg-white"
          style={{
            maxHeight: activeTab ? landscapeSheetMaxHeight : 0,
            opacity: activeTab ? 1 : 0,
            transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
          }}
        >
          <div
            ref={sheetRef}
            className="overflow-y-auto px-4 pb-4 pt-3"
            style={{ maxHeight: landscapeSheetMaxHeight, overscrollBehavior: 'contain' }}
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
        </div>
      </div>
    );
  }

  // ── 세로 레이아웃 ────────────────────────────────────────────────
  // 세로 명함 또는 가로 명함을 세로 뷰포트에서 볼 때 모두 이 경로 사용
  // needsCssRotation=true일 때는 카드를 CSS rotate(-90deg)로 회전시켜 가로 형태로 표시

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

  // CardCanvas 엘리먼트 — 회전 여부에 따라 canvasRotation prop으로 드래그 좌표 보정
  const cardCanvasElement = (
    <CardCanvas
      theme={theme}
      data={data}
      onPositionsChange={(positions) => handleChange({ elementPositions: positions })}
      onStickersChange={(newStickers) => handleChange({ stickers: newStickers })}
      canvasRotation={needsCssRotation ? 90 : 0}
      maxWidthOverride={needsCssRotation ? '100%' : undefined}
    />
  );

  // 가로 명함을 세로 뷰포트에서 CSS 회전으로 표시
  //   outer: 시각적 bbox (aspect 5:9 — 세로로 긴 형태)
  //   inner: 회전 전 카드 박스 (aspect 9:5, width 180% = 100%×9/5)
  //          translate(-50%,-50%) rotate(-90deg)으로 outer 중앙에 정확히 끼워짐
  //   CardCanvas는 inner 내부에 100% 너비로 채움
  // maxWidth:50%는 세로 명함 기본값과 동일한 시각 크기로 맞춤 (세로 뷰포트에서 과도하게 커지는 것 방지)
  const rotatedCardWrapper = (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '50%',
        aspectRatio: '5 / 9',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '180%',
          aspectRatio: '9 / 5',
          transform: 'translate(-50%, -50%) rotate(-90deg)',
          transformOrigin: 'center',
        }}
      >
        {cardCanvasElement}
      </div>
    </div>
  );

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
            paddingBottom: activeTab ? sheetOpenPadding : sheetClosedPadding,
            transition: 'padding-bottom 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div className="w-full max-w-2xl">
            {needsCssRotation ? rotatedCardWrapper : cardCanvasElement}
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
    </div>
  );
}
