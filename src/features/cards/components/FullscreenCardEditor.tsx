/**
 * FullscreenCardEditor
 *
 * 전체화면 명함 편집기 — 모바일 최적화
 * - 상단: 명함 캔버스 (드래그로 요소 위치 조정 가능)
 * - 하단: 탭바 (레이어 / 색상 / 배경)
 * - 탭 선택 시 바텀 시트가 슬라이드업
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
  { id: 'layer',      label: '레이어', icon: <Layers size={20} />   },
  { id: 'color',      label: '색상',   icon: <Palette size={20} />  },
  { id: 'background', label: '배경',   icon: <ImageBg size={20} />  },
];

// 바텀 시트 최대 높이 (vh)
const SHEET_MAX_VH = 52;

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

  // 외부 theme 변경 시 동기화 (드래그로 positions 변경 등)
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

  // 탭이 열릴 때 시트 상단으로 스크롤
  useEffect(() => {
    if (activeTab && sheetRef.current) {
      sheetRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* ── 상단 닫기 버튼 ── */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-end px-4 pt-safe-top py-3 pointer-events-none">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          title="닫기"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── 캔버스 영역 ── */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden px-4"
        style={{
          // 바텀 시트가 열려 있으면 위로 올라간 높이만큼 패딩
          paddingBottom: activeTab ? `${SHEET_MAX_VH}vh` : '72px',
          paddingTop: '56px',
          transition: 'padding-bottom 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="w-full max-w-xl">
          <CardCanvas
            theme={theme}
            data={data}
            onPositionsChange={(positions) =>
              handleChange({ elementPositions: positions })
            }
            onStickersChange={(stickers) =>
              handleChange({ stickers })
            }
          />
        </div>
      </div>

      {/* ── 바텀 시트 ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col"
        style={{ zIndex: 20 }}
      >
        {/* 시트 콘텐츠 (슬라이드업) */}
        <div
          ref={sheetRef}
          className="overflow-y-auto rounded-t-2xl bg-white px-4 pb-4 pt-3"
          style={{
            maxHeight: activeTab ? `${SHEET_MAX_VH}vh` : 0,
            opacity: activeTab ? 1 : 0,
            transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
            overscrollBehavior: 'contain',
          }}
        >
          {/* 드래그 핸들 */}
          <div className="mb-3 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-slate-200" />
          </div>

          {activeTab === 'layer' && (
            <LayerPanel
              theme={theme}
              stickers={stickers}
              data={data}
              onChange={handleChange}
              onClearStickers={() => handleChange({ stickers: [] })}
            />
          )}
          {activeTab === 'color' && (
            <ColorTab theme={theme} onChange={handleChange} />
          )}
          {activeTab === 'background' && (
            <BackgroundTab theme={theme} onChange={handleChange} />
          )}
        </div>

        {/* 탭 바 */}
        <div
          className="flex items-center border-t border-slate-800 bg-black pb-safe-bottom"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* 왼쪽: 위치 조정 안내 */}
          <div className="flex-1 px-4 py-2">
            <p className="text-[10px] text-slate-500">캔버스를 드래그해 위치 조정</p>
          </div>

          {/* 오른쪽: 기능 탭 버튼들 */}
          <div className="flex">
            {BOTTOM_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => toggleTab(tab.id)}
                  className={[
                    'flex flex-col items-center gap-0.5 px-5 py-3 transition',
                    isActive ? 'text-white' : 'text-slate-500',
                  ].join(' ')}
                >
                  {tab.icon}
                  <span className="text-[10px] font-medium">{tab.label}</span>
                  {isActive && (
                    <span className="block h-0.5 w-4 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
