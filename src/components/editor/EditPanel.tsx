/**
 * EditPanel Component
 *
 * 탭 기반 테마 커스터마이징 패널
 * 탭: 프리셋 | 색상 | 폰트 | 배경
 *
 * 색상·폰트·배경 변경 시 presetId가 자동으로 'custom'으로 전환됩니다.
 */

import React, { useState } from 'react';
import { BottomSheet } from '../../shared/ui/BottomSheet';
import type {
  CardTheme,
  ThemePresetId,
  ColorPaletteId,
  FontSetId,
  ProfileShape,
  CardContentTokens,
  CardStyleTokens,
} from '../../theme/types';
import { THEME_PRESETS, COLOR_PALETTES, FONT_SETS, GRADIENT_PRESETS, PATTERN_PRESETS } from '../../theme/presets';
import { getLayoutCapabilities } from '../../theme/capabilities';
import { BusinessCard } from '../business-card/BusinessCard';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  theme: CardTheme;
  data?: CardContentTokens;
  onChange: (partial: Partial<CardTheme>) => void;
};

type TabId = 'preset' | 'color' | 'font' | 'background';

const TABS: { id: TabId; label: string }[] = [
  { id: 'preset', label: '프리셋' },
  { id: 'color', label: '색상' },
  { id: 'font', label: '폰트' },
  { id: 'background', label: '배경' },
];

// ── 프리셋 탭 ─────────────────────────────────────────────────────────────────

const NAMED_PRESET_IDS: ThemePresetId[] = [
  'minimal_light', 'minimal_dark', 'modern_gradient', 'campus_vibrant', 'tech_blue',
  'elegant_serif', 'creative_colorful', 'corporate_neutral', 'warm_autumn', 'cool_minimal',
];

const PRESET_LABELS: Record<ThemePresetId, string> = {
  minimal_light: '미니멀 라이트',
  minimal_dark: '미니멀 다크',
  modern_gradient: '모던 그라데이션',
  campus_vibrant: '캠퍼스 바이브런트',
  tech_blue: '테크 블루',
  elegant_serif: '엘레강트 세리프',
  creative_colorful: '크리에이티브 컬러풀',
  corporate_neutral: '코퍼레이트 뉴트럴',
  warm_autumn: '웜 오텀',
  cool_minimal: '쿨 미니멀',
  custom: '자유 설정',
};

function PresetTab({ theme, onChange, hasProfileUrl }: {
  theme: CardTheme;
  onChange: (partial: Partial<CardTheme>) => void;
  hasProfileUrl: boolean;
}) {
  const isCustom = theme.presetId === 'custom';

  return (
    <div className="space-y-3">
      {/* 자유 설정 버튼 */}
      <button
        type="button"
        onClick={() => onChange({ presetId: 'custom' })}
        className={[
          'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition',
          isCustom ? 'border-slate-900 bg-slate-50' : 'border-slate-100 bg-white hover:border-slate-300',
        ].join(' ')}
      >
        {/* 무지개 그라데이션 아이콘 */}
        <div
          className="h-10 w-10 flex-shrink-0 rounded-xl shadow-sm"
          style={{ background: 'linear-gradient(135deg, #f43f5e, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)' }}
        />
        <div className="min-w-0 flex-1">
          <div className={['text-xs font-semibold leading-tight', isCustom ? 'text-slate-900' : 'text-slate-700'].join(' ')}>
            자유 설정
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">색상·폰트·배경을 직접 조합</div>
        </div>
        {isCustom && (
          <div className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
            ✓
          </div>
        )}
      </button>

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">프리셋</p>
        <div className="grid grid-cols-2 gap-2">
          {NAMED_PRESET_IDS.map((presetId) => {
            const isSelected = theme.presetId === presetId;
            const preset = THEME_PRESETS[presetId];
            const bgColor = preset.background.type === 'solid' ? preset.background.color : preset.primary;

            return (
              <button
                key={presetId}
                type="button"
                onClick={() => {
                  const newPreset = THEME_PRESETS[presetId];
                  const profileShape =
                    hasProfileUrl && newPreset.profileShape === 'none'
                      ? (theme.style.profileShape !== 'none' ? theme.style.profileShape : 'circle')
                      : newPreset.profileShape;
                  onChange({ presetId, style: { ...newPreset, profileShape } });
                }}
                className={[
                  'flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition',
                  isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-100 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                <div className="h-10 w-10 flex-shrink-0 rounded-xl shadow-sm" style={{ backgroundColor: bgColor }} />
                <div className="min-w-0 flex-1">
                  <div className={['text-xs font-semibold leading-tight', isSelected ? 'text-slate-900' : 'text-slate-700'].join(' ')}>
                    {PRESET_LABELS[presetId]}
                  </div>
                  <div className="mt-0.5 flex gap-1">
                    {[preset.primary, preset.secondary, preset.accent].map((c, i) => (
                      <div key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 색상 탭 ───────────────────────────────────────────────────────────────────

const PALETTE_IDS: ColorPaletteId[] = [
  'slate', 'blue', 'purple', 'emerald', 'orange', 'rose', 'indigo', 'teal', 'amber', 'pink',
];

const PALETTE_LABELS: Record<ColorPaletteId, string> = {
  slate: '슬레이트', blue: '블루', purple: '퍼플', emerald: '에메랄드', orange: '오렌지',
  rose: '로즈', indigo: '인디고', teal: '틸', amber: '앰버', pink: '핑크',
};

const ELEMENT_COLORS: { label: string; key: keyof Pick<CardStyleTokens, 'primary' | 'secondary' | 'accent' | 'text'> }[] = [
  { label: '이름',        key: 'primary' },
  { label: '한줄소개',    key: 'secondary' },
  { label: '소속',        key: 'accent' },
  { label: '연락처 / 링크', key: 'text' },
];

function ColorTab({ theme, onChange }: {
  theme: CardTheme;
  onChange: (partial: Partial<CardTheme>) => void;
}) {
  const applyStyle = (patch: Partial<CardStyleTokens>) =>
    onChange({ presetId: 'custom', style: { ...theme.style, ...patch } });

  return (
    <div className="space-y-6">
      {/* 팔레트 프리셋 */}
      <div>
        <div className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">색상 팔레트</div>
        <div className="grid grid-cols-5 gap-2">
          {PALETTE_IDS.map((paletteId) => {
            const isSelected = theme.paletteId === paletteId;
            const palette = COLOR_PALETTES[paletteId];

            return (
              <button
                key={paletteId}
                type="button"
                onClick={() => onChange({
                  paletteId,
                  presetId: 'custom',
                  style: { ...theme.style, ...palette },
                })}
                className={[
                  'flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition',
                  isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-100 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                <div className="w-full overflow-hidden rounded-lg" style={{ height: 36 }}>
                  <div className="flex h-full">
                    {[palette.primary, palette.secondary, palette.accent].map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className={['text-[10px] font-medium', isSelected ? 'text-slate-900' : 'text-slate-500'].join(' ')}>
                  {PALETTE_LABELS[paletteId]}
                </div>
                {isSelected && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[8px] text-white">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 요소별 색상 */}
      <div>
        <div className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">요소별 색상</div>
        <div className="space-y-2">
          {ELEMENT_COLORS.map(({ label, key }) => {
            const currentColor = theme.style[key] as string;
            return (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 transition hover:border-slate-300"
              >
                <span className="w-24 shrink-0 text-xs font-medium text-slate-700">{label}</span>
                <div className="relative shrink-0">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => applyStyle({ [key]: e.target.value })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="h-7 w-7 rounded-lg border border-slate-200 shadow-sm"
                    style={{ backgroundColor: currentColor }}
                  />
                </div>
                <span className="font-mono text-[11px] text-slate-400">{currentColor}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 폰트 탭 ───────────────────────────────────────────────────────────────────

const FONT_SET_IDS: FontSetId[] = ['gothic', 'myeongjo', 'round'];

const FONT_SET_LABELS: Record<FontSetId, string> = {
  gothic: '고딕',
  myeongjo: '명조',
  round: '라운드',
};

const FONT_SAMPLE = '안녕하세요 Hello 123';

function FontTab({ theme, onChange }: {
  theme: CardTheme;
  onChange: (partial: Partial<CardTheme>) => void;
}) {
  return (
    <div className="space-y-2">
      {FONT_SET_IDS.map((fontSetId) => {
        const isSelected = theme.fontSetId === fontSetId;
        const fontSet = FONT_SETS[fontSetId];

        return (
          <button
            key={fontSetId}
            type="button"
            onClick={() => onChange({
              fontSetId,
              presetId: 'custom',
              style: { ...theme.style, ...fontSet },
            })}
            className={[
              'flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 transition',
              isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-100 bg-white hover:border-slate-300',
            ].join(' ')}
          >
            <div className="flex-1 text-left">
              <div
                className={['text-base font-semibold', isSelected ? 'text-slate-900' : 'text-slate-700'].join(' ')}
                style={{ fontFamily: fontSet.titleFont, fontWeight: fontSet.titleWeight }}
              >
                {FONT_SET_LABELS[fontSetId]}
              </div>
              <div
                className="mt-1 text-sm text-slate-500"
                style={{ fontFamily: fontSet.bodyFont, fontWeight: fontSet.bodyWeight }}
              >
                {FONT_SAMPLE}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">
                {fontSet.titleFont.split(',')[0]}
              </div>
            </div>
            {isSelected && (
              <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── 배경 탭 ───────────────────────────────────────────────────────────────────

const SOLID_COLORS = ['#ffffff', '#f8fafc', '#0f172a', '#1e293b'];

function BackgroundTab({ theme, onChange }: {
  theme: CardTheme;
  onChange: (partial: Partial<CardTheme>) => void;
}) {
  const capabilities = getLayoutCapabilities(theme.layoutId);
  const currentBg = theme.style.background;
  const currentShape = theme.style.profileShape;

  const applyStyle = (patch: Partial<CardStyleTokens>) =>
    onChange({ presetId: 'custom', style: { ...theme.style, ...patch } });

  const shapes: { id: ProfileShape; label: string; icon: React.ReactNode }[] = [
    { id: 'circle', label: '원형', icon: <div className="h-8 w-8 rounded-full bg-slate-300" /> },
    { id: 'rounded', label: '둥근 모서리', icon: <div className="h-8 w-8 rounded-xl bg-slate-300" /> },
  ];

  return (
    <div className="space-y-6">
      {/* 단색 */}
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">단색</div>
        <div className="grid grid-cols-4 gap-2">
          {SOLID_COLORS.map((color) => {
            const isSelected = currentBg.type === 'solid' && currentBg.color === color;
            const isLight = color === '#ffffff' || color === '#f8fafc';
            return (
              <button
                key={color}
                type="button"
                onClick={() => applyStyle({ background: { type: 'solid', color } })}
                className={[
                  'h-14 w-full rounded-2xl border-2 transition',
                  isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                    : 'border-slate-200 hover:border-slate-400',
                ].join(' ')}
                style={{ backgroundColor: color }}
              >
                {isSelected && (
                  <span style={{ color: isLight ? '#0f172a' : '#ffffff' }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 그라데이션 */}
      {capabilities.allowGradient && (
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">그라데이션</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(GRADIENT_PRESETS).map((gradientId) => {
              const isSelected = currentBg.type === 'gradient' && currentBg.presetId === gradientId;
              return (
                <button
                  key={gradientId}
                  type="button"
                  onClick={() => applyStyle({ background: { type: 'gradient', presetId: gradientId } })}
                  className={[
                    'h-16 w-full rounded-2xl border-2 transition',
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                      : 'border-slate-200 hover:border-slate-400',
                  ].join(' ')}
                  style={{ backgroundImage: GRADIENT_PRESETS[gradientId] }}
                >
                  {isSelected && <span className="text-white drop-shadow">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 패턴 */}
      {capabilities.allowPattern && (
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">패턴</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(PATTERN_PRESETS).map((patternId) => {
              const isSelected = currentBg.type === 'pattern' && currentBg.patternId === patternId;
              return (
                <button
                  key={patternId}
                  type="button"
                  onClick={() => applyStyle({ background: { type: 'pattern', patternId } })}
                  className={[
                    'h-16 w-full rounded-2xl border-2 bg-white transition',
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                      : 'border-slate-200 hover:border-slate-400',
                  ].join(' ')}
                  style={{ backgroundImage: PATTERN_PRESETS[patternId] }}
                >
                  {isSelected && <span className="text-slate-900">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 프로필 모양 */}
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">프로필 모양</div>
        <div className="grid grid-cols-3 gap-2">
          {shapes.map((shape) => {
            const isSelected = currentShape === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => applyStyle({ profileShape: shape.id })}
                className={[
                  'flex flex-col items-center gap-2 rounded-2xl border-2 py-3 px-2 transition',
                  isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-100 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                {shape.icon}
                <div className={['text-xs font-medium', isSelected ? 'text-slate-900' : 'text-slate-600'].join(' ')}>
                  {shape.label}
                </div>
                {isSelected && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[8px] text-white">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function EditPanel({ isOpen, onClose, theme, data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('preset');

  // 미리보기 + 탭 바를 고정 슬롯에 배치 (스크롤 영역 밖)
  const stickyHeader = (
    <div>
      {/* 실시간 미리보기 */}
      {data && (
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <p className="mb-3 text-center text-[10px] font-medium text-slate-400 uppercase tracking-wide">
            실시간 미리보기
          </p>
          {/* 카드 전체가 보이도록: scale(0.65) 적용, 컨테이너 높이는 자연 높이의 65% */}
          <div className="relative overflow-hidden" style={{ height: '200px' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: 'scale(0.65)',
                transformOrigin: 'top center',
              }}
            >
              <BusinessCard theme={theme} data={data} />
            </div>
          </div>
        </div>
      )}

      {/* 탭 바 */}
      <div className="border-b border-slate-100 bg-white px-6 py-3">
        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-1 rounded-xl py-2 text-sm font-semibold transition',
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="스타일 편집" stickyPreview={stickyHeader}>
      {/* 탭 콘텐츠만 스크롤 영역에 위치 */}
      <div className="pb-8">
        {activeTab === 'preset' && (
          <PresetTab theme={theme} onChange={onChange} hasProfileUrl={!!data?.profileUrl} />
        )}
        {activeTab === 'color' && (
          <ColorTab theme={theme} onChange={onChange} />
        )}
        {activeTab === 'font' && (
          <FontTab theme={theme} onChange={onChange} />
        )}
        {activeTab === 'background' && (
          <BackgroundTab theme={theme} onChange={onChange} />
        )}
      </div>
    </BottomSheet>
  );
}
