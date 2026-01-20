import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { CardPreview } from '../features/cards/components/CardPreview';
import type { CardData } from '../features/cards/types';
import { getPublicCard, saveReceivedCardFromPublicCard } from '../features/share/api/shareApi';
import { useToast } from '../shared/ui/Toast';

type RouteParams = {
  cardId: string;
};

export function PublicCardPage() {
  const { cardId } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  useEffect(() => {
    if (!cardId) {
      setError('잘못된 링크입니다.');
      setLoading(false);
      return;
    }

    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicCard(cardId);
        if (!ignore) {
          if (!data) {
            setError('명함을 찾을 수 없어요.');
            setCard(null);
          } else {
            setCard(data);
          }
        }
      } catch (err: any) {
        console.error('[PublicCardPage] 카드 조회 오류:', err);
        if (!ignore) {
          setError('명함을 불러오는 중 오류가 발생했어요.');
          setCard(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      ignore = true;
    };
  }, [cardId]);

  const previewCard: Omit<CardData, 'id'> | null = useMemo(() => {
    if (!card) return null;
    const { id: _id, ...rest } = card;
    return rest;
  }, [card]);

  // 자동 저장 처리 (로그인 후 돌아왔을 때)
  useEffect(() => {
    if (!cardId || !card || !user || authLoading || autoSaving) return;

    const intent = searchParams.get('intent');
    const sourceCardId = searchParams.get('sourceCardId');

    if (intent === 'saveReceived' && sourceCardId === cardId) {
      // URL에서 intent 파라미터 제거
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('intent');
      newSearchParams.delete('sourceCardId');
      const newSearch = newSearchParams.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`,
      );

      // 자동 저장 실행
      const performAutoSave = async () => {
        setAutoSaving(true);
        try {
          await saveReceivedCardFromPublicCard({
            source_card_id: cardId,
            snapshot: {
              display_name: card.display_name,
              headline: card.headline,
              organization: card.organization,
              email: card.email,
              phone: card.phone,
              links: {
                instagram: card.links.instagram,
                github: card.links.github,
                website: card.links.website,
              },
              style: {
                template_id: card.style.template_id,
                theme_color: card.style.theme_color,
                font_family: card.style.font_family,
                orientation: card.style.orientation,
              },
            },
            tags: [],
            folder_id: null,
            memo: '',
          });

          showToast('받은 명함에 저장했어요.', 'success');
          navigate('/app?tab=received');
        } catch (err: any) {
          console.error('[PublicCardPage] 자동 저장 오류:', err);
          if (err?.code === 'DUPLICATE_RECEIVED_CARD') {
            showToast('이미 저장된 명함이에요.', 'info');
          } else {
            showToast(err?.message ?? '명함을 저장하는 중 오류가 발생했어요.', 'error');
          }
          // 중복이어도 받은 명함 탭으로 이동
          navigate('/app?tab=received');
        } finally {
          setAutoSaving(false);
        }
      };

      void performAutoSave();
    }
  }, [cardId, card, user, authLoading, searchParams, navigate, showToast, autoSaving]);

  const handleSave = async () => {
    if (!cardId || !card) return;

    if (!user) {
      // 로그인 페이지로 이동하면서 returnUrl과 intent 포함
      const params = new URLSearchParams({
        returnUrl: `/c/${cardId}`,
        intent: 'saveReceived',
        sourceCardId: cardId,
      });
      // 세션 스토리지에도 저장 (OAuth 리다이렉트 후 복구용)
      sessionStorage.setItem('authReturnUrl', `/c/${cardId}?intent=saveReceived&sourceCardId=${cardId}`);
      navigate(`/login?${params.toString()}`);
      return;
    }

    setSaving(true);
    try {
      await saveReceivedCardFromPublicCard({
        source_card_id: cardId,
        snapshot: {
          display_name: card.display_name,
          headline: card.headline,
          organization: card.organization,
          email: card.email,
          phone: card.phone,
          links: {
            instagram: card.links.instagram,
            github: card.links.github,
            website: card.links.website,
          },
          style: {
            template_id: card.style.template_id,
            theme_color: card.style.theme_color,
            font_family: card.style.font_family,
            orientation: card.style.orientation,
          },
        },
        tags: [],
        folder_id: null,
        memo: '',
      });

      showToast('받은 명함에 저장했어요.', 'success');
      navigate('/app?tab=received');
    } catch (err: any) {
      console.error('[PublicCardPage] 받은 명함 저장 오류:', err);
      if (err?.code === 'DUPLICATE_RECEIVED_CARD') {
        showToast('이미 저장된 명함이에요.', 'info');
        navigate('/app?tab=received');
      } else {
        showToast(err?.message ?? '명함을 저장하는 중 오류가 발생했어요.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || (autoSaving && user)) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-xl items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Dabida · 디지털 명함
              </p>
              <p className="text-sm font-medium text-slate-800">공유한 명함</p>
            </div>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
            <p className="text-sm text-slate-500">
              {autoSaving ? '받은 명함에 저장하는 중입니다...' : '명함을 불러오는 중입니다...'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !previewCard) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-xl items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Dabida · 디지털 명함
              </p>
              <p className="text-sm font-medium text-slate-800">공유한 명함</p>
            </div>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-900">명함을 찾을 수 없어요</p>
            <p className="mt-2 text-xs text-slate-500">
              링크가 잘못되었거나, 삭제된 명함일 수 있어요.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Dabida · 디지털 명함
            </p>
            <p className="text-sm font-medium text-slate-800">공유한 명함</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="rounded-2xl bg-white p-5 shadow-md">
            <CardPreview card={previewCard} />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs text-slate-500">
              이 명함을 내 연락처에 저장해 두고 싶다면 아래 버튼을 눌러주세요.
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || autoSaving}
              className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {user
                ? saving || autoSaving
                  ? '저장 중...'
                  : '받은 명함에 저장'
                : authLoading
                ? '로그인 상태 확인 중...'
                : '로그인 후 저장'}
            </button>
            {!user && !authLoading && (
              <p className="mt-2 text-center text-[11px] text-slate-400">
                버튼을 누르면 로그인 페이지로 이동한 뒤, 다시 이 화면으로 돌아와 저장할 수 있어요.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


