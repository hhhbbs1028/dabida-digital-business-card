import React from 'react';
import type { CardTheme, CardStyleTokens, ColorPaletteId } from '../../../../theme/types';
import { COLOR_PALETTES } from '../../../../theme/presets';

// ── 공유 색상 유틸리티 ──────────────────────────────────────────────────────────

export const RECENT_COLORS_KEY = 'dabida_recent_colors';
const MAX_RECENT = 10;

export function loadRecentColors(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_COLORS_KEY) ?? '[]'); } catch { return []; }
}
export function saveRecentColor(hex: string) {
  const prev = loadRecentColors().filter((c) => c !== hex);
  localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify([hex, ...prev].slice(0, MAX_RECENT)));
}
export function isValidHex(v: string) { return /^#[0-9a-fA-F]{6}$/.test(v); }

// ── 팔레트 ──────────────────────────────────────────────────────────────────────

export const PALETTE_IDS: ColorPaletteId[] = [
  'slate', 'blue', 'purple', 'emerald', 'orange', 'rose', 'indigo', 'teal', 'amber', 'pink',
];

export const PALETTE_LABELS: Record<ColorPaletteId, string> = {
  slate: '슬레이트', blue: '블루', purple: '퍼플', emerald: '에메랄드', orange: '오렌지',
  rose: '로즈', indigo: '인디고', teal: '틸', amber: '앰버', pink: '핑크',
};

export const ELEMENT_COLORS: { label: string; key: keyof Pick<CardStyleTokens, 'primary' | 'secondary' | 'accent' | 'text'> }[] = [
  { label: '이름',           key: 'primary'   },
  { label: '한줄소개',       key: 'secondary' },
  { label: '소속',           key: 'accent'    },
  { label: '연락처 / 링크',  key: 'text'      },
];

// ── ColorRow ───────────────────────────────────────────────────────────────────

export function ColorRow({
  label, color, onCommit,
}: { label: string; color: string; onCommit: (hex: string) => void }) {
  const [hex, setHex] = React.useState(color);
  React.useEffect(() => { setHex(color); }, [color]);

  const commit = (val: string) => {
    if (!isValidHex(val)) { setHex(color); return; }
    saveRecentColor(val);
    onCommit(val);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
      <span className="w-24 shrink-0 text-xs font-medium text-slate-700">{label}</span>

      <label className="relative shrink-0 cursor-pointer">
        <input
          type="color"
          value={hex}
          onChange={(e) => { setHex(e.target.value); onCommit(e.target.value); }}
          onBlur={(e) => commit(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`${label} 색상 선택`}
        />
        <div
          className="h-9 w-9 rounded-xl border-2 border-white shadow-md ring-1 ring-slate-200 transition hover:scale-105"
          style={{ backgroundColor: hex }}
        />
      </label>

      <input
        type="text"
        value={hex}
        maxLength={7}
        onChange={(e) => setHex(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
        className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
        placeholder="#000000"
        spellCheck={false}
      />
    </div>
  );
}

// ── ColorTab ───────────────────────────────────────────────────────────────────

export function ColorTab({ theme, onChange }: {
  theme: CardTheme;
  onChange: (partial: Partial<CardTheme>) => void;
}) {
  const [recentColors, setRecentColors] = React.useState<string[]>(loadRecentColors);

  const applyStyle = (patch: Partial<CardStyleTokens>) => {
    onChange({ presetId: 'custom', style: { ...theme.style, ...patch } });
  };

  const handleColorCommit = (key: keyof CardStyleTokens, hex: string) => {
    applyStyle({ [key]: hex });
    setRecentColors(loadRecentColors());
  };

  return (
    <div className="space-y-6">
      {/* ── 팔레트 프리셋 ── */}
      <div>
        <div className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">색상 팔레트</div>
        {/* 가로 모드에서는 10열로 펼쳐 2행 → 1행으로 높이 절감 (landscape: 변형은 Tailwind 내장) */}
        <div className="grid grid-cols-5 gap-2 landscape:grid-cols-10">
          {PALETTE_IDS.map((paletteId) => {
            const isSelected = theme.paletteId === paletteId;
            const palette = COLOR_PALETTES[paletteId];
            return (
              <button
                key={paletteId}
                type="button"
                onClick={() => onChange({ paletteId, presetId: 'custom', style: { ...theme.style, ...palette } })}
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
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[8px] text-white">✓</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 요소별 자유 색상 ── */}
      <div>
        <div className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">요소별 색상</div>
        {/* 가로 모드에서는 2열로 배치하여 4행 → 2행으로 높이 절감 */}
        <div className="grid grid-cols-1 gap-2 landscape:grid-cols-2">
          {ELEMENT_COLORS.map(({ label, key }) => (
            <ColorRow
              key={key}
              label={label}
              color={theme.style[key] as string}
              onCommit={(hex) => handleColorCommit(key, hex)}
            />
          ))}
        </div>
      </div>

      {/* ── 최근 사용 색상 ── */}
      {recentColors.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">최근 사용</div>
          <div className="flex flex-wrap gap-2">
            {recentColors.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  applyStyle({ primary: c });
                  setRecentColors(loadRecentColors());
                }}
                className="h-8 w-8 rounded-xl border-2 border-white shadow ring-1 ring-slate-200 transition hover:scale-110"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">탭하면 이름 색상에 적용됩니다</p>
        </div>
      )}
    </div>
  );
}
