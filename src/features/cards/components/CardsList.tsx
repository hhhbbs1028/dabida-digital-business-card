import type { CardData } from '../types';
import { CardPreview } from './CardPreview';

type Props = {
  cards: CardData[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onDeleteDirect: (id: string) => void;
};

export function CardsList({
  cards,
  selectedId,
  loading,
  error,
  onSelect,
  onDeleteDirect,
}: Props) {
  return (
    <aside>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-text-primary">내 명함</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-secondary">명함을 불러오는 중입니다...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-toss border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
              {error}
            </div>
          )}

          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-toss-xl bg-bg-gray px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-toss-xl bg-primary-50 text-2xl">
                💳
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-text-primary">아직 저장된 명함이 없어요</p>
                <p className="text-xs text-text-tertiary">오른쪽에서 첫 번째 명함을 만들어보세요.</p>
              </div>
            </div>
          ) : (
            /* ── 카드 스택 ── */
            <div className="flex flex-col">
              {cards.map((card) => {
                const isActive = selectedId === card.id;

                return (
                  <div
                    key={card.id}
                    className="group relative transition-all duration-200"
                  >
                    {/* 카드 본체 */}
                    <div
                      onClick={() => onSelect(card.id)}
                      className="cursor-pointer overflow-hidden rounded-2xl p-2.5 transition-transform active:scale-[0.98]"
                      style={{
                        outline: isActive ? '2px solid #9299aa' : 'none',
                        outlineOffset: '3px',
                      }}
                    >
                      <CardPreview card={card} />
                    </div>

                    {/* 삭제 버튼 (호버 시 노출) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('정말 삭제하시겠습니까?')) onDeleteDirect(card.id);
                      }}
                      className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                      title="삭제"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
