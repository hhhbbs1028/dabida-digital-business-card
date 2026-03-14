/**
 * EditPanel Component
 * 
 * Bottom Sheet 기반 테마 커스터마이징 패널
 * 
 * 설계 원칙:
 * - 토스 스타일의 여백 넉넉/텍스트 가독성/버튼 피드백 확실
 * - 각 섹션별로 옵션 선택 UI 제공
 * - onChange로 상위 상태 업데이트
 * - 선택된 옵션은 selected 상태 표시
 */

import React from 'react';
import { BottomSheet } from '../../shared/ui/BottomSheet';
import type { CardTheme, ThemePresetId, ColorPaletteId, FontSetId, ProfileShape, CardContentTokens } from '../../theme/types';
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

/**
 * 프리셋 선택 섹션
 */
function PresetSection({ theme, onChange }: { theme: CardTheme; onChange: (partial: Partial<CardTheme>) => void }) {
  const presetIds: ThemePresetId[] = [
    'minimal_light',
    'minimal_dark',
    'modern_gradient',
    'campus_vibrant',
    'tech_blue',
    'elegant_serif',
    'creative_colorful',
    'corporate_neutral',
    'warm_autumn',
    'cool_minimal',
  ];

  const presetLabels: Record<ThemePresetId, string> = {
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
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">테마 프리셋</h3>
        <p className="mt-1 text-xs text-slate-500">원하는 스타일을 선택하세요</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {presetIds.map((presetId) => {
          const isSelected = theme.presetId === presetId;
          const preset = THEME_PRESETS[presetId];
          const bgColor = preset.background.type === 'solid' ? preset.background.color : preset.primary;

          return (
            <button
              key={presetId}
              type="button"
              onClick={() => {
                const newPreset = THEME_PRESETS[presetId];
                onChange({
                  presetId,
                  style: newPreset,
                });
              }}
              className={[
                'flex items-center gap-2 rounded-xl border-2 p-3 text-left transition',
                isSelected
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              ].join(' ')}
            >
              <div
                className="h-8 w-8 flex-shrink-0 rounded-lg"
                style={{ backgroundColor: bgColor }}
              />
              <div className="min-w-0 flex-1">
                <div
                  className={[
                    'text-xs font-medium',
                    isSelected ? 'text-slate-900' : 'text-slate-700',
                  ].join(' ')}
                >
                  {presetLabels[presetId]}
                </div>
              </div>
              {isSelected && (
                <div className="flex-shrink-0 text-slate-900">✓</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 색상 팔레트 선택 섹션
 */
function ColorSection({ theme, onChange }: { theme: CardTheme; onChange: (partial: Partial<CardTheme>) => void }) {
  const paletteIds: ColorPaletteId[] = [
    'slate',
    'blue',
    'purple',
    'emerald',
    'orange',
    'rose',
    'indigo',
    'teal',
    'amber',
    'pink',
  ];

  const paletteLabels: Record<ColorPaletteId, string> = {
    slate: '슬레이트',
    blue: '블루',
    purple: '퍼플',
    emerald: '에메랄드',
    orange: '오렌지',
    rose: '로즈',
    indigo: '인디고',
    teal: '틸',
    amber: '앰버',
    pink: '핑크',
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">색상 팔레트</h3>
        <p className="mt-1 text-xs text-slate-500">원하는 색상 조합을 선택하세요</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {paletteIds.map((paletteId) => {
          const isSelected = theme.paletteId === paletteId;
          const palette = COLOR_PALETTES[paletteId];

          return (
            <button
              key={paletteId}
              type="button"
              onClick={() => {
                onChange({
                  paletteId,
                  style: {
                    ...theme.style,
                    ...palette,
                  },
                });
              }}
              className={[
                'relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition',
                isSelected
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              ].join(' ')}
            >
              <div
                className="h-10 w-full rounded-lg"
                style={{ backgroundColor: palette.primary }}
              />
              <div
                className={[
                  'text-[10px] font-medium',
                  isSelected ? 'text-slate-900' : 'text-slate-600',
                ].join(' ')}
              >
                {paletteLabels[paletteId]}
              </div>
              {isSelected && (
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 폰트 세트 선택 섹션
 */
function FontSection({ theme, onChange }: { theme: CardTheme; onChange: (partial: Partial<CardTheme>) => void }) {
  const fontSetIds: FontSetId[] = ['gothic', 'myeongjo', 'round'];

  const fontSetLabels: Record<FontSetId, string> = {
    gothic: '고딕',
    myeongjo: '명조',
    round: '라운드',
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">폰트 세트</h3>
        <p className="mt-1 text-xs text-slate-500">제목과 본문에 사용할 폰트를 선택하세요</p>
      </div>
      <div className="space-y-2">
        {fontSetIds.map((fontSetId) => {
          const isSelected = theme.fontSetId === fontSetId;
          const fontSet = FONT_SETS[fontSetId];

          return (
            <button
              key={fontSetId}
              type="button"
              onClick={() => {
                onChange({
                  fontSetId,
                  style: {
                    ...theme.style,
                    ...fontSet,
                  },
                });
              }}
              className={[
                'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition',
                isSelected
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              ].join(' ')}
            >
              <div>
                <div
                  className={[
                    'text-sm font-medium',
                    isSelected ? 'text-slate-900' : 'text-slate-700',
                  ].join(' ')}
                  style={{ fontFamily: fontSet.titleFont }}
                >
                  {fontSetLabels[fontSetId]}
                </div>
                <div
                  className="mt-0.5 text-xs text-slate-500"
                  style={{ fontFamily: fontSet.bodyFont }}
                >
                  {fontSet.titleFont.split(',')[0]}
                </div>
              </div>
              {isSelected && (
                <div className="flex-shrink-0 text-slate-900">✓</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 배경 선택 섹션
 */
function BackgroundSection({ theme, onChange }: { theme: CardTheme; onChange: (partial: Partial<CardTheme>) => void }) {
  const capabilities = getLayoutCapabilities(theme.layoutId);
  const currentBg = theme.style.background;

  // Solid 옵션
  const solidColors = ['#ffffff', '#f8fafc', '#0f172a', '#1e293b'];

  // Gradient 옵션
  const gradientIds = Object.keys(GRADIENT_PRESETS);

  // Pattern 옵션
  const patternIds = Object.keys(PATTERN_PRESETS);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">배경</h3>
        <p className="mt-1 text-xs text-slate-500">카드 배경 스타일을 선택하세요</p>
      </div>

      {/* Solid */}
      <div>
        <div className="mb-2 text-xs font-medium text-slate-700">단색</div>
        <div className="grid grid-cols-4 gap-2">
          {solidColors.map((color) => {
            const isSelected = currentBg.type === 'solid' && currentBg.color === color;
            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange({
                    style: {
                      ...theme.style,
                      background: { type: 'solid', color },
                    },
                  });
                }}
                className={[
                  'h-12 w-full rounded-xl border-2 transition',
                  isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                    : 'border-slate-200 hover:border-slate-300',
                ].join(' ')}
                style={{ backgroundColor: color }}
              >
                {isSelected && (
                  <div className="flex h-full items-center justify-center text-white">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gradient */}
      {capabilities.allowGradient && (
        <div>
          <div className="mb-2 text-xs font-medium text-slate-700">그라데이션</div>
          <div className="grid grid-cols-3 gap-2">
            {gradientIds.map((gradientId) => {
              const isSelected = currentBg.type === 'gradient' && currentBg.presetId === gradientId;
              return (
                <button
                  key={gradientId}
                  type="button"
                  onClick={() => {
                    onChange({
                      style: {
                        ...theme.style,
                        background: { type: 'gradient', presetId: gradientId },
                      },
                    });
                  }}
                  className={[
                    'h-16 w-full rounded-xl border-2 transition',
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                      : 'border-slate-200 hover:border-slate-300',
                  ].join(' ')}
                  style={{ backgroundImage: GRADIENT_PRESETS[gradientId] }}
                >
                  {isSelected && (
                    <div className="flex h-full items-center justify-center text-white drop-shadow-lg">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pattern */}
      {capabilities.allowPattern && (
        <div>
          <div className="mb-2 text-xs font-medium text-slate-700">패턴</div>
          <div className="grid grid-cols-3 gap-2">
            {patternIds.map((patternId) => {
              const isSelected = currentBg.type === 'pattern' && currentBg.patternId === patternId;
              return (
                <button
                  key={patternId}
                  type="button"
                  onClick={() => {
                    onChange({
                      style: {
                        ...theme.style,
                        background: { type: 'pattern', patternId },
                      },
                    });
                  }}
                  className={[
                    'h-16 w-full rounded-xl border-2 bg-white transition',
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                      : 'border-slate-200 hover:border-slate-300',
                  ].join(' ')}
                  style={{ backgroundImage: PATTERN_PRESETS[patternId] }}
                >
                  {isSelected && (
                    <div className="flex h-full items-center justify-center text-slate-900">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 프로필 모양 선택 섹션
 */
function ProfileSection({ theme, onChange }: { theme: CardTheme; onChange: (partial: Partial<CardTheme>) => void }) {
  const capabilities = getLayoutCapabilities(theme.layoutId);
  const currentShape = theme.style.profileShape;

  const shapes: { id: ProfileShape; label: string }[] = [
    { id: 'circle', label: '원형' },
    { id: 'rounded', label: '둥근 모서리' },
    ...(capabilities.allowProfileNone ? [{ id: 'none' as ProfileShape, label: '없음' }] : []),
  ];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">프로필 모양</h3>
        <p className="mt-1 text-xs text-slate-500">프로필 이미지 모양을 선택하세요</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {shapes.map((shape) => {
          const isSelected = currentShape === shape.id;
          return (
            <button
              key={shape.id}
              type="button"
              onClick={() => {
                onChange({
                  style: {
                    ...theme.style,
                    profileShape: shape.id,
                  },
                });
              }}
              className={[
                'relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition',
                isSelected
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              ].join(' ')}
            >
              <div
                className={[
                  'h-12 w-12 bg-slate-200',
                  shape.id === 'circle' ? 'rounded-full' : shape.id === 'rounded' ? 'rounded-xl' : '',
                ].join(' ')}
              />
              <div
                className={[
                  'text-xs font-medium',
                  isSelected ? 'text-slate-900' : 'text-slate-600',
                ].join(' ')}
              >
                {shape.label}
              </div>
              {isSelected && (
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * EditPanel 메인 컴포넌트
 */
export function EditPanel({ isOpen, onClose, theme, data, onChange }: Props) {
  const previewSlot = data ? (
    <div className="px-4 py-3">
      <p className="mb-2 text-center text-[10px] font-medium text-slate-400 uppercase tracking-wide">
        실시간 미리보기
      </p>
      <div className="relative overflow-hidden" style={{ height: '108px' }}>
        <div
          style={{
            transform: 'scale(0.58)',
            transformOrigin: 'top center',
            position: 'absolute',
            inset: 0,
          }}
        >
          <BusinessCard theme={theme} data={data} />
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="스타일 커스터마이징" stickyPreview={previewSlot}>
      <div className="space-y-8 pb-6">
        <PresetSection theme={theme} onChange={onChange} />
        <ColorSection theme={theme} onChange={onChange} />
        <FontSection theme={theme} onChange={onChange} />
        <BackgroundSection theme={theme} onChange={onChange} />
        <ProfileSection theme={theme} onChange={onChange} />
      </div>
    </BottomSheet>
  );
}

