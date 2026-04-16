import React, { useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import type { CardTheme, CardStyleTokens } from '../../../../theme/types';
import { GRADIENT_PRESETS, PATTERN_PRESETS } from '../../../../theme/presets';
import { getLayoutCapabilities } from '../../../../theme/capabilities';
import { isValidHex, saveRecentColor } from './ColorTab';

const SOLID_COLORS = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#0f172a', '#1e293b', '#334155', '#475569'];

type BackgroundTabProps = {
  theme: CardTheme;
  onChange: (partial: Partial<CardTheme>) => void;
  onUploadImage?: (file: File) => Promise<string>;
};

export function BackgroundTab({ theme, onChange, onUploadImage }: BackgroundTabProps) {
  const capabilities = getLayoutCapabilities(theme.layoutId);
  const currentBg = theme.style.background;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const applyStyle = (patch: Partial<CardStyleTokens>) =>
    onChange({ presetId: 'custom', style: { ...theme.style, ...patch } });

  const customSolidColor = currentBg.type === 'solid' ? currentBg.color : '#ffffff';
  const [customHex, setCustomHex] = useState(customSolidColor);
  React.useEffect(() => {
    if (currentBg.type === 'solid') setCustomHex(currentBg.color);
  }, [currentBg]);

  const commitCustomBg = (val: string) => {
    if (!isValidHex(val)) { setCustomHex(customSolidColor); return; }
    saveRecentColor(val);
    applyStyle({ background: { type: 'solid', color: val } });
  };

  const handleImageUpload = async (file: File) => {
    if (!onUploadImage) return;
    setImageUploading(true);
    setImageUploadError(null);
    try {
      const url = await onUploadImage(file);
      applyStyle({ background: { type: 'image', url } });
    } catch (e: any) {
      setImageUploadError(e?.message ?? '업로드 중 오류가 발생했습니다.');
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    // 가로 모드에서는 2열 그리드로 섹션을 묶어 높이를 절감
    <div className="space-y-6 landscape:grid landscape:grid-cols-2 landscape:gap-x-5 landscape:gap-y-4 landscape:space-y-0">
      {/* 단색 프리셋 + 자유 색상 */}
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">단색</div>
        {/* 가로 모드: 2행×4열 → 1행×8열 */}
        <div className="grid grid-cols-4 gap-2 landscape:grid-cols-8">
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
          <div className="grid grid-cols-3 gap-2 landscape:grid-cols-6">
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
          <div className="grid grid-cols-3 gap-2 landscape:grid-cols-6">
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

      {/* 이미지 배경 */}
      {onUploadImage && (
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">이미지</div>
          <button
            type="button"
            disabled={imageUploading}
            onClick={() => imageInputRef.current?.click()}
            className={[
              'flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 text-sm font-medium transition',
              currentBg.type === 'image'
                ? 'border-slate-900 bg-slate-50 text-slate-900'
                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50',
              imageUploading ? 'opacity-60 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {imageUploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                업로드 중...
              </>
            ) : (
              <>
                <ImageIcon size={18} className="text-slate-500" />
                <span>{currentBg.type === 'image' ? '이미지 교체' : '갤러리에서 배경 선택'}</span>
              </>
            )}
          </button>
          {currentBg.type === 'image' && (
            <button
              type="button"
              onClick={() => applyStyle({ background: { type: 'solid', color: '#ffffff' } })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white py-2 text-xs text-slate-500 transition hover:border-red-200 hover:text-red-500"
            >
              이미지 배경 제거
            </button>
          )}
          {imageUploadError && (
            <p className="mt-1 text-xs text-red-500">{imageUploadError}</p>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
        </div>
      )}
    </div>
  );
}
