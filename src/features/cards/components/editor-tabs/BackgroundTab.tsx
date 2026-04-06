import React from 'react';
import type { CardTheme, CardStyleTokens, ProfileShape } from '../../../../theme/types';
import { GRADIENT_PRESETS, PATTERN_PRESETS } from '../../../../theme/presets';
import { getLayoutCapabilities } from '../../../../theme/capabilities';
import { isValidHex, saveRecentColor } from './ColorTab';

const SOLID_COLORS = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#0f172a', '#1e293b', '#334155', '#475569'];

export function BackgroundTab({ theme, onChange }: {
  theme: CardTheme;
  onChange: (partial: Partial<CardTheme>) => void;
}) {
  const capabilities = getLayoutCapabilities(theme.layoutId);
  const currentBg = theme.style.background;
  const currentShape = theme.style.profileShape;

  const applyStyle = (patch: Partial<CardStyleTokens>) =>
    onChange({ presetId: 'custom', style: { ...theme.style, ...patch } });

  const customSolidColor = currentBg.type === 'solid' ? currentBg.color : '#ffffff';
  const [customHex, setCustomHex] = React.useState(customSolidColor);
  React.useEffect(() => {
    if (currentBg.type === 'solid') setCustomHex(currentBg.color);
  }, [currentBg]);

  const commitCustomBg = (val: string) => {
    if (!isValidHex(val)) { setCustomHex(customSolidColor); return; }
    saveRecentColor(val);
    applyStyle({ background: { type: 'solid', color: val } });
  };

  const shapes: { id: ProfileShape; label: string; icon: React.ReactNode }[] = [
    { id: 'circle', label: '원형', icon: <div className="h-8 w-8 rounded-full bg-slate-300" /> },
    { id: 'rounded', label: '둥근 모서리', icon: <div className="h-8 w-8 rounded-xl bg-slate-300" /> },
  ];

  return (
    <div className="space-y-6">
      {/* 단색 프리셋 + 자유 색상 */}
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">단색</div>
        <div className="grid grid-cols-4 gap-2">
          {SOLID_COLORS.map((color) => {
            const isSelected = currentBg.type === 'solid' && currentBg.color === color;
            const isLight = parseInt(color.slice(1, 3), 16) > 180;
            return (
              <button
                key={color}
                type="button"
                onClick={() => applyStyle({ background: { type: 'solid', color } })}
                className={[
                  'h-12 w-full rounded-2xl border-2 transition',
                  isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                    : 'border-slate-200 hover:border-slate-400',
                ].join(' ')}
                style={{ backgroundColor: color }}
              >
                {isSelected && (
                  <span style={{ color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.875rem' }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 자유 색상 행 */}
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
          <span className="shrink-0 text-xs font-medium text-slate-700">직접 지정</span>
          <label className="relative shrink-0 cursor-pointer">
            <input
              type="color"
              value={customHex}
              onChange={(e) => { setCustomHex(e.target.value); applyStyle({ background: { type: 'solid', color: e.target.value } }); }}
              onBlur={(e) => commitCustomBg(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="배경 색상 직접 선택"
            />
            <div
              className="h-9 w-9 rounded-xl border-2 border-white shadow-md ring-1 ring-slate-200 transition hover:scale-105"
              style={{ backgroundColor: customHex }}
            />
          </label>
          <input
            type="text"
            value={customHex}
            maxLength={7}
            onChange={(e) => setCustomHex(e.target.value)}
            onBlur={(e) => commitCustomBg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitCustomBg((e.target as HTMLInputElement).value); }}
            className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
            placeholder="#ffffff"
            spellCheck={false}
          />
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
