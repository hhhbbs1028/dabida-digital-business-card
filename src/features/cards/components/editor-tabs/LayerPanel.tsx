import type { CardTheme, CardContentTokens, CardElementPositions, StickerElement } from '../../../../theme/types';

const TEXT_LAYER_DEFS: { key: keyof CardElementPositions; label: string; abbr: string }[] = [
  { key: 'name',    label: '이름',       abbr: '이름' },
  { key: 'tagline', label: '한 줄 소개', abbr: '소개' },
  { key: 'major',   label: '소속',       abbr: '소속' },
  { key: 'contact', label: '연락처',     abbr: '연락' },
  { key: 'links',   label: '링크',       abbr: '링크' },
];

type Props = {
  theme: CardTheme;
  stickers: StickerElement[];
  data?: CardContentTokens;
  onChange: (partial: Partial<CardTheme>) => void;
  onClearStickers?: () => void;
};

type StickerLayer = { kind: 'sticker'; id: string; sticker: StickerElement; opacity: number; zIndex: number; rotation: number; };
type ProfileLayer = { kind: 'profile'; id: 'profile'; src: string; opacity: number; zIndex: number; };
type TextLayer    = { kind: 'text'; id: string; key: keyof CardElementPositions; label: string; abbr: string; opacity: number; zIndex: number; fontScale: number; };
type AnyLayer = TextLayer | StickerLayer | ProfileLayer;

export function LayerPanel({ theme, stickers, data, onChange, onClearStickers }: Props) {
  const textLayers: TextLayer[] = TEXT_LAYER_DEFS
    .filter(({ key }) => {
      if (!data) return false;
      if (key === 'name')    return !!data.name;
      if (key === 'tagline') return !!data.tagline;
      if (key === 'major')   return !!data.major;
      if (key === 'contact') return !!(data.email || data.phone);
      if (key === 'links')   return !!(data.links?.instagram || data.links?.github || data.links?.website);
      return false;
    })
    .map(({ key, label, abbr }) => ({
      kind: 'text' as const,
      id: `text_${key}`,
      key,
      label,
      abbr,
      opacity:   theme.elementPositions?.[key]?.opacity   ?? 1,
      zIndex:    theme.elementPositions?.[key]?.zIndex     ?? 100,
      fontScale: theme.elementPositions?.[key]?.fontScale  ?? 1,
    }));

  const stickerLayers: StickerLayer[] = stickers.map((s) => ({
    kind: 'sticker' as const,
    id: s.id,
    sticker: s,
    opacity: s.opacity,
    zIndex: s.zIndex,
    rotation: s.rotation,
  }));

  const profileLayers: ProfileLayer[] = data?.profileUrl ? [{
    kind: 'profile' as const,
    id: 'profile' as const,
    src: data.profileUrl,
    opacity: theme.elementPositions?.profile?.opacity ?? 1,
    zIndex:  theme.elementPositions?.profile?.zIndex  ?? 100,
  }] : [];

  const allLayers = ([...textLayers, ...stickerLayers, ...profileLayers] as AnyLayer[])
    .sort((a, b) => b.zIndex - a.zIndex);

  if (allLayers.length === 0) {
    return (
      <p className="text-center text-xs text-slate-400 py-6">
        명함에 표시될 내용이 없습니다
      </p>
    );
  }

  const removeSticker = (id: string) =>
    onChange({ stickers: stickers.filter((s) => s.id !== id) });

  const swapZIndex = (itemA: AnyLayer, itemB: AnyLayer) => {
    const zA = itemA.zIndex;
    const zB = itemB.zIndex;
    const newStickers = stickers.map((s) => {
      if (itemA.kind === 'sticker' && s.id === itemA.id) return { ...s, zIndex: zB };
      if (itemB.kind === 'sticker' && s.id === itemB.id) return { ...s, zIndex: zA };
      return s;
    });
    const prevPos = theme.elementPositions ?? {};
    let newPos: CardElementPositions = { ...prevPos };
    if (itemA.kind === 'text'    && prevPos[itemA.key]) newPos = { ...newPos, [itemA.key]: { ...prevPos[itemA.key]!, zIndex: zB } };
    if (itemB.kind === 'text'    && prevPos[itemB.key]) newPos = { ...newPos, [itemB.key]: { ...prevPos[itemB.key]!, zIndex: zA } };
    if (itemA.kind === 'profile' && prevPos.profile)    newPos = { ...newPos, profile: { ...prevPos.profile, zIndex: zB } };
    if (itemB.kind === 'profile' && prevPos.profile)    newPos = { ...newPos, profile: { ...prevPos.profile, zIndex: zA } };
    onChange({ stickers: newStickers, elementPositions: newPos });
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          레이어 ({allLayers.length})
        </span>
        {stickers.length > 0 && onClearStickers && (
          <button
            type="button"
            onClick={onClearStickers}
            className="text-[11px] text-red-400 hover:text-red-600 transition"
          >
            스티커 삭제
          </button>
        )}
      </div>

      <div className="space-y-2">
        {allLayers.map((item, idx, arr) => {
          const isFirst = idx === 0;
          const isLast  = idx === arr.length - 1;

          const moveUp   = () => { if (!isFirst) swapZIndex(item, arr[idx - 1]); };
          const moveDown = () => { if (!isLast)  swapZIndex(item, arr[idx + 1]); };

          const setOpacity = (val: number) => {
            if (item.kind === 'sticker') {
              onChange({ stickers: stickers.map((s) => s.id === item.id ? { ...s, opacity: val } : s) });
            } else if (item.kind === 'profile') {
              const prevPos = theme.elementPositions ?? {};
              if (prevPos.profile) onChange({ elementPositions: { ...prevPos, profile: { ...prevPos.profile, opacity: val } } });
            } else {
              const prevPos = theme.elementPositions ?? {};
              if (prevPos[item.key]) onChange({ elementPositions: { ...prevPos, [item.key]: { ...prevPos[item.key]!, opacity: val } } });
            }
          };

          const setFontScale = (val: number) => {
            if (item.kind !== 'text') return;
            const prevPos = theme.elementPositions ?? {};
            if (prevPos[item.key]) onChange({ elementPositions: { ...prevPos, [item.key]: { ...prevPos[item.key]!, fontScale: val } } });
          };

          return (
            <div
              key={item.id}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${item.kind === 'text' ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-100 bg-white'}`}
            >
              {/* 썸네일 */}
              <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border overflow-hidden text-xs font-semibold ${item.kind === 'text' ? 'border-indigo-100 bg-indigo-50 text-indigo-400' : 'border-slate-100 bg-slate-50'}`}>
                {item.kind === 'profile' ? (
                  <img src={item.src} alt="프로필" className="h-full w-full object-cover" />
                ) : item.kind === 'sticker' ? (
                  item.sticker.type === 'emoji' ? (
                    <span className="text-xl">{item.sticker.src}</span>
                  ) : (
                    <img src={item.sticker.src} alt="" className="h-full w-full object-cover" />
                  )
                ) : (
                  item.abbr
                )}
              </div>

              {/* 슬라이더 그룹 */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {item.kind === 'text' && (
                  <span className="text-[10px] font-medium text-indigo-500">{item.label}</span>
                )}
                {item.kind === 'profile' && (
                  <span className="text-[10px] font-medium text-slate-400">프로필 사진</span>
                )}

                {/* 투명도 (텍스트 레이어 제외) */}
                {item.kind !== 'text' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">투명도</span>
                      <span className="font-mono text-[10px] text-slate-400">{Math.round(item.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range" min={0} max={1} step={0.05}
                      value={item.opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer accent-indigo-500"
                    />
                  </div>
                )}

                {/* 폰트 크기 (텍스트만) */}
                {item.kind === 'text' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">크기</span>
                      <span className="font-mono text-[10px] text-slate-400">{item.fontScale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range" min={0.5} max={2.0} step={0.1}
                      value={item.fontScale}
                      onChange={(e) => setFontScale(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer accent-indigo-500"
                    />
                  </div>
                )}

                {/* 회전 (스티커만) */}
                {item.kind === 'sticker' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">회전</span>
                      <span className="font-mono text-[10px] text-slate-400">{Math.round(item.rotation)}°</span>
                    </div>
                    <input
                      type="range" min={-180} max={180} step={1}
                      value={item.rotation}
                      onChange={(e) => onChange({ stickers: stickers.map((s) => s.id === item.id ? { ...s, rotation: Number(e.target.value) } : s) })}
                      className="h-1.5 w-full cursor-pointer accent-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* 순서 버튼 + 삭제 */}
              <div className="mt-1 flex flex-col gap-0.5">
                <button
                  type="button" disabled={isFirst} onClick={moveUp} title="위로"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                >▲</button>
                <button
                  type="button" disabled={isLast} onClick={moveDown} title="아래로"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                >▼</button>
                {item.kind === 'sticker' ? (
                  <button
                    type="button"
                    onClick={() => removeSticker(item.id)}
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] text-red-400 transition hover:bg-red-50 hover:text-red-600"
                    title="삭제"
                  >✕</button>
                ) : (
                  <div className="h-5 w-5 mt-0.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-slate-400">
        캔버스에서 드래그하여 위치·크기를 조정할 수 있어요
      </p>
    </div>
  );
}
