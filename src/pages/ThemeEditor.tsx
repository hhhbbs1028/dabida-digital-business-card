import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import type {
  CardTheme,
  ThemePresetId,
  ColorPaletteId,
  FontSetId,
  ProfileShape,
  CardContentTokens,
  CardStyleTokens,
  StickerElement,
} from '../theme/types';
import { THEME_PRESETS, COLOR_PALETTES, FONT_SETS, GRADIENT_PRESETS, PATTERN_PRESETS } from '../theme/presets';
import { getLayoutCapabilities } from '../theme/capabilities';
import { CardCanvas } from '../components/business-card/CardCanvas';
import type { CardData } from '../features/cards/types';
import { uploadToStorage } from '../shared/infrastructure/storageApi';
import { supabase } from '../shared/infrastructure/supabaseClient';
import { setBackInterceptor } from '../shared/utils/backIntercept';
import { CardEditor } from '../features/cards/components/CardEditor';

type Props = {
  theme: CardTheme;
  data?: Omit<CardData, 'id'>;
  onChange: (theme: CardTheme) => void;
  onClose: () => void;
};

type TabId = 'preset' | 'color' | 'font' | 'background' | 'sticker';

const TABS: { id: TabId; label: string }[] = [
  { id: 'preset',     label: '프리셋' },
  { id: 'color',      label: '색상'   },
  { id: 'font',       label: '폰트'   },
  { id: 'background', label: '배경'   },
  { id: 'sticker',    label: '꾸미기' },
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
  { label: '이름',           key: 'primary'   },
  { label: '한줄소개',       key: 'secondary' },
  { label: '소속',           key: 'accent'    },
  { label: '연락처 / 링크',  key: 'text'      },
];

const RECENT_COLORS_KEY = 'dabida_recent_colors';
const MAX_RECENT = 10;

function loadRecentColors(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_COLORS_KEY) ?? '[]'); } catch { return []; }
}
function saveRecentColor(hex: string) {
  const prev = loadRecentColors().filter((c) => c !== hex);
  localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify([hex, ...prev].slice(0, MAX_RECENT)));
}

/** hex 문자열 유효성 검사 */
function isValidHex(v: string) { return /^#[0-9a-fA-F]{6}$/.test(v); }

/** 개별 색상 행 컴포넌트 */
function ColorRow({
  label, color, onCommit,
}: { label: string; color: string; onCommit: (hex: string) => void }) {
  const [hex, setHex] = React.useState(color);
  // 외부에서 color 변경되면 동기화
  React.useEffect(() => { setHex(color); }, [color]);

  const commit = (val: string) => {
    if (!isValidHex(val)) { setHex(color); return; }
    saveRecentColor(val);
    onCommit(val);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
      <span className="w-24 shrink-0 text-xs font-medium text-slate-700">{label}</span>

      {/* 컬러 픽커 버튼 — 크게, 눌리는 느낌 명확하게 */}
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

      {/* hex 직접 입력 */}
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

function ColorTab({ theme, onChange }: {
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
        <div className="grid grid-cols-5 gap-2">
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
        <div className="space-y-2">
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
                  /* 가장 최근에 편집한 요소(primary)에 적용 */
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

const SOLID_COLORS = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#0f172a', '#1e293b', '#334155', '#475569'];

function BackgroundTab({ theme, onChange }: {
  theme: CardTheme;
  onChange: (partial: Partial<CardTheme>) => void;
}) {
  const capabilities = getLayoutCapabilities(theme.layoutId);
  const currentBg = theme.style.background;
  const currentShape = theme.style.profileShape;

  const applyStyle = (patch: Partial<CardStyleTokens>) =>
    onChange({ presetId: 'custom', style: { ...theme.style, ...patch } });

  // 자유 단색 배경 — 현재 solid 색상 or 흰색
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

// ── 꾸미기 탭 ─────────────────────────────────────────────────────────────────

const EMOJI_GROUPS: { label: string; items: string[] }[] = [
  { label: '하트 & 감정', items: ['❤️','💕','💖','🧡','💛','💚','💙','💜','🖤','🤍','😊','😍','🥰','🤩','😎'] },
  { label: '자연',         items: ['🌸','🌻','🌈','🌙','⭐','✨','☀️','🍀','🌿','🔥','⚡','❄️','🌊','🦋','🌺'] },
  { label: '꾸미기',       items: ['👑','💎','🏆','🎨','🎉','🎊','🎀','🎵','🎶','📸','💡','🔮','🌟','🍭','🧁'] },
];

function StickerTab({
  theme,
  onChange,
  onUploadImage,
}: {
  theme: CardTheme;
  onChange: (partial: Partial<CardTheme>) => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const stickers = theme.stickers ?? [];

  const addSticker = (emoji: string) => {
    const newSticker: StickerElement = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'emoji',
      src: emoji,
      x: 50,
      y: 50,
      width: 12,
      rotation: 0,
      opacity: 1,
      zIndex: (stickers.length > 0 ? Math.max(...stickers.map((s) => s.zIndex)) : 0) + 1,
    };
    onChange({ stickers: [...stickers, newSticker] });
  };

  const addImageSticker = async (file: File) => {
    if (!onUploadImage) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await onUploadImage(file);
      const newSticker: StickerElement = {
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'image',
        src: url,
        x: 50,
        y: 50,
        width: 25,
        rotation: 0,
        opacity: 1,
        zIndex: (stickers.length > 0 ? Math.max(...stickers.map((s) => s.zIndex)) : 0) + 1,
      };
      onChange({ stickers: [...stickers, newSticker] });
    } catch (e: any) {
      setUploadError(e?.message ?? '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeSticker = (id: string) =>
    onChange({ stickers: stickers.filter((s) => s.id !== id) });

  const clearAll = () => onChange({ stickers: [] });

  return (
    <div className="space-y-6">
      {/* 이모지 스티커 */}
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {group.label}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.items.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addSticker(emoji)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-white text-2xl shadow-sm transition hover:border-slate-300 hover:scale-110 active:scale-95"
                title={`${emoji} 추가`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 갤러리 이미지 업로드 */}
      {onUploadImage && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            내 사진 추가
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white py-4 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                업로드 중...
              </>
            ) : (
              <>
                <span className="text-xl">🖼️</span>
                갤러리에서 사진 선택
              </>
            )}
          </button>
          {uploadError && (
            <p className="mt-1 text-xs text-red-500">{uploadError}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addImageSticker(file);
            }}
          />
        </div>
      )}

      {/* ── 레이어 패널 ── */}
      {stickers.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              레이어 ({stickers.length})
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] text-red-400 hover:text-red-600 transition"
            >
              전체 삭제
            </button>
          </div>

          {/* z-order 높은 것이 위에 표시 */}
          <div className="space-y-2">
            {stickers
              .slice()
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((s, idx, arr) => {
                const isFirst = idx === 0;               // 최상단
                const isLast  = idx === arr.length - 1; // 최하단

                const moveUp = () => {
                  // zIndex 1 증가
                  const updated = stickers.map((st) =>
                    st.id === s.id ? { ...st, zIndex: st.zIndex + 1 } : st
                  );
                  onChange({ stickers: updated });
                };
                const moveDown = () => {
                  const updated = stickers.map((st) =>
                    st.id === s.id ? { ...st, zIndex: Math.max(0, st.zIndex - 1) } : st
                  );
                  onChange({ stickers: updated });
                };
                const setOpacity = (val: number) => {
                  const updated = stickers.map((st) =>
                    st.id === s.id ? { ...st, opacity: val } : st
                  );
                  onChange({ stickers: updated });
                };

                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
                  >
                    {/* 썸네일 */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-xl">
                      {s.type === 'emoji' ? s.src : (
                        <img src={s.src} alt="" className="h-full w-full rounded-lg object-cover" />
                      )}
                    </div>

                    {/* 투명도 슬라이더 */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">투명도</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {Math.round(s.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={s.opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* 순서 버튼 */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={moveUp}
                        title="위로"
                        className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={moveDown}
                        title="아래로"
                        className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    {/* 삭제 */}
                    <button
                      type="button"
                      onClick={() => removeSticker(s.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] text-red-400 transition hover:bg-red-50 hover:text-red-600"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            캔버스에서 드래그하여 위치·크기를 조정할 수 있어요
          </p>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function ThemeEditor({ theme: initialTheme, data, onChange, onClose }: Props) {
  const [theme, setTheme] = useState<CardTheme>(initialTheme);
  const [activeTab, setActiveTab] = useState<TabId>('preset');

  // 최신 theme·콜백을 ref로 유지 (back interceptor에서 사용)
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 하드웨어 뒤로가기 인터셉터 등록
  useEffect(() => {
    setBackInterceptor(() => {
      onChangeRef.current(themeRef.current);
      onCloseRef.current();
    });
    // 네이티브 환경이 아닌 경우 대비해 Capacitor 리스너도 등록
    if (!Capacitor.isNativePlatform()) return () => setBackInterceptor(null);
    const listener = CapApp.addListener('backButton', () => {
      onChangeRef.current(themeRef.current);
      onCloseRef.current();
    });
    return () => {
      setBackInterceptor(null);
      listener.then((h) => h.remove());
    };
  }, []);

  const handleBack = () => {
    onChange(theme);
    onClose();
  };

  const handleChange = (partial: Partial<CardTheme>) => {
    setTheme((prev) => ({ ...prev, ...partial }));
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error('로그인이 필요합니다.');
    return uploadToStorage('stickers', file, authData.user.id);
  };

  const previewData: CardContentTokens = {
    name: data?.display_name ?? '',
    major: data?.organization || undefined,
    tagline: data?.headline || undefined,
    email: data?.email || undefined,
    phone: data?.phone || undefined,
    links: {
      instagram: data?.links?.instagram || undefined,
      github: data?.links?.github || undefined,
      website: data?.links?.website || undefined,
    },
    profileUrl: data?.profile_url || undefined,
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      {/* 헤더 */}
      <div
        className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:bg-slate-200"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-base font-semibold text-slate-900">스타일 편집</h1>
      </div>

      {/* 카드 미리보기 */}
      <div className="flex items-center justify-center border-b border-slate-100 bg-white px-4 py-4">
        <div className="w-full max-w-sm">
          <CardCanvas
            theme={theme}
            data={previewData}
            onPositionsChange={(positions) => setTheme((prev) => ({ ...prev, elementPositions: positions }))}
            onStickersChange={(stickers) => setTheme((prev) => ({ ...prev, stickers }))}
          />
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-slate-200 bg-white">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex-1 py-3 text-[13px] font-medium transition',
              activeTab === tab.id
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        {activeTab === 'preset'     && <PresetTab     theme={theme} onChange={handleChange} hasProfileUrl={!!previewData.profileUrl} />}
        {activeTab === 'color'      && <ColorTab      theme={theme} onChange={handleChange} />}
        {activeTab === 'font'       && <FontTab       theme={theme} onChange={handleChange} />}
        {activeTab === 'background' && <BackgroundTab theme={theme} onChange={handleChange} />}
        {activeTab === 'sticker'    && <StickerTab    theme={theme} onChange={handleChange} onUploadImage={handleUploadImage} />}
      </div>
    </div>
  );
}
