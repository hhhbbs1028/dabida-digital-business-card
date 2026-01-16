import React, { useEffect, useMemo, useState } from 'react';
import { CardEditor } from '../CardEditor';
import type { CardData } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { AuthPanel } from '../components/AuthPanel';
import { getMyProfile, type Profile } from '../lib/profileApi';
import { ProfileForm } from '../components/ProfileForm';
import { useNavigate } from 'react-router-dom';
import { resolveNextRoute } from '../lib/onboardingFlow';

export function StudioPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState([] as CardData[]);
  const [selectedId, setSelectedId] = useState(null as string | null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [profile, setProfile] = useState(null as Profile | null);
  const [showProfile, setShowProfile] = useState(false);

  const routeCheckedRef = React.useRef(false);
  useEffect(() => {
    if (authLoading || routeCheckedRef.current) return;
    routeCheckedRef.current = true;
    let mounted = true;
    resolveNextRoute()
      .then((result) => {
        if (!mounted) return;
        if (result.nextRoute !== '/studio') {
          navigate(result.nextRoute);
        }
      })
      .catch((err) => console.error('[StudioPage] flow error', err));
    return () => {
      mounted = false;
    };
  }, [authLoading, navigate]);

  useEffect(() => {
    let ignore = false;
    const loadProfile = async () => {
      if (!user) return;
      const data = await getMyProfile();
      if (!ignore) {
        setProfile(data);
      }
    };
    void loadProfile();
    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    let ignore = false;
    const loadCards = async () => {
      if (!user) {
        setCards([]);
        return;
      }

      setCardsLoading(true);
      const { data, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!ignore) {
        if (cardsError) {
          console.error(cardsError);
          setError('명함을 불러오지 못했습니다.');
        } else if (data) {
          setCards(
            data.map((row: any) => ({
              id: row.id,
              display_name: row.display_name ?? '',
              headline: row.headline ?? '',
              organization: row.organization ?? '',
              email: row.email ?? '',
              phone: row.phone ?? '',
              links: {
                instagram: row.links?.instagram ?? '',
                github: row.links?.github ?? '',
                website: row.links?.website ?? '',
              },
              style: {
                template_id: row.style?.template_id ?? 1,
                theme_color: row.style?.theme_color ?? '#111827',
                font_family: row.style?.font_family ?? 'sans',
                orientation: row.style?.orientation ?? 'horizontal',
              },
            })),
          );
        }
        setCardsLoading(false);
      }
    };

    void loadCards();
    return () => {
      ignore = true;
    };
  }, [user]);

  const defaultStyle = useMemo(() => {
    if (!profile) return undefined;
    if (!profile.selected_template_id) return undefined;
    return {
      template_id: profile.selected_template_id ?? 1,
      theme_color: profile.selected_theme_color ?? '#111827',
      font_family: (profile.selected_font_family as any) ?? 'sans',
    };
  }, [profile]);

  const selected = cards.find((c) => c.id === selectedId) ?? null;

  const handleSave = async (card: CardData) => {
    if (!user) {
      setError('저장하려면 먼저 로그인해야 합니다.');
      return;
    }

    setError(null);
    setCardsLoading(true);

    try {
      const existing = cards.find((c) => c.id === card.id);

      if (existing) {
        const { error: updateError } = await supabase
          .from('cards')
          .update({
            display_name: card.display_name,
            headline: card.headline,
            organization: card.organization,
            email: card.email,
            phone: card.phone,
            links: {
              instagram: card.links.instagram || null,
              github: card.links.github || null,
              website: card.links.website || null,
            },
            style: {
              template_id: card.style.template_id,
              theme_color: card.style.theme_color,
              font_family: card.style.font_family,
            },
          })
          .eq('id', existing.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(updateError);
          setError(`명함 수정 중 문제가 발생했습니다: ${updateError.message}`);
          return;
        }

        setCards((prev) =>
          prev.map((c) => (c.id === existing.id ? { ...card, id: existing.id } : c)),
        );
        setSelectedId(existing.id);
      } else {
        const { data, error: insertError } = await supabase
          .from('cards')
          .insert({
            user_id: user.id,
            display_name: card.display_name,
            headline: card.headline,
            organization: card.organization,
            email: card.email,
            phone: card.phone,
            links: {
              instagram: card.links.instagram || null,
              github: card.links.github || null,
              website: card.links.website || null,
            },
            style: {
              template_id: card.style.template_id,
              theme_color: card.style.theme_color,
              font_family: card.style.font_family,
            },
          })
          .select('*')
          .single();

        if (insertError) {
          console.error(insertError);
          setError(`명함 생성 중 문제가 발생했습니다: ${insertError.message}`);
          return;
        }

        const newCard: CardData = {
          id: data.id,
          display_name: data.display_name ?? '',
          headline: data.headline ?? '',
          organization: data.organization ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          links: {
            instagram: data.links?.instagram ?? '',
            github: data.links?.github ?? '',
            website: data.links?.website ?? '',
          },
          style: {
            template_id: data.style?.template_id ?? card.style.template_id,
            theme_color: data.style?.theme_color ?? card.style.theme_color,
            font_family: data.style?.font_family ?? card.style.font_family,
            orientation: data.style?.orientation ?? card.style.orientation,
          },
        };

        setCards((prev) => [newCard, ...prev]);
        setSelectedId(newCard.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(`저장 중 오류가 발생했습니다: ${err?.message ?? '알 수 없는 오류'}`);
    } finally {
      setCardsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const target = cards.find((c) => c.id === id);
    if (!target) return;

    if (!confirm(`"${target.display_name || '이름 없음'}" 명함을 삭제하시겠습니까?`)) {
      return;
    }

    setError(null);
    setCardsLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error(deleteError);
        setError(`명함 삭제 중 문제가 발생했습니다: ${deleteError.message}`);
        return;
      }

      setCards((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(`삭제 중 오류가 발생했습니다: ${err?.message ?? '알 수 없는 오류'}`);
    } finally {
      setCardsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-base font-semibold text-slate-900">Dabida · 명함 스튜디오</h1>
            <p className="mt-1 text-xs text-slate-500">
              {profile?.name ? `${profile.name} · ${profile.university ?? ''}` : '프로필을 기반으로 명함을 관리하세요.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="hidden items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 md:inline-flex"
            >
              <span className="text-base leading-none">＋</span>
              새 명함 만들기
            </button>
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="hidden items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 md:inline-flex"
            >
              내 프로필
            </button>
            <AuthPanel />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
          <aside>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  내 명함
                </h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  여러 개의 프로필 명함을 만들어두고 필요할 때 골라 쓰세요.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
              {error && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-700">
                  {error}
                </div>
              )}
              {authLoading ? (
                <div className="flex items-center justify-center py-6">
                  <p className="text-xs text-slate-500">로그인 상태를 확인하는 중입니다...</p>
                </div>
              ) : !user ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-6 text-center">
                  <p className="text-xs font-medium text-slate-900">로그인이 필요합니다</p>
                  <p className="text-[11px] text-slate-500">
                    명함을 저장하려면 먼저 로그인해 주세요.
                  </p>
                </div>
              ) : cardsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <p className="text-xs text-slate-500">명함을 불러오는 중입니다...</p>
                </div>
              ) : cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-6 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    Card
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-900">아직 저장된 명함이 없어요</p>
                    <p className="text-[11px] text-slate-500">
                      오른쪽에서 첫 번째 명함을 만들어보세요.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {cards.map((card) => {
                    const isActive = selectedId === card.id;
                    return (
                      <li key={card.id}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedId(card.id)}
                            className={[
                              'flex w-full flex-1 items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs shadow-sm transition',
                              isActive
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
                            ].join(' ')}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold">
                                {card.display_name || '이름 없음'}
                              </p>
                              <p
                                className={[
                                  'truncate text-[11px]',
                                  isActive ? 'text-slate-100/80' : 'text-slate-500',
                                ].join(' ')}
                              >
                                {card.headline || card.organization || '설명 없음'}
                              </p>
                            </div>
                            <span
                              className={[
                                'ml-3 inline-flex h-6 min-w-[52px] items-center justify-center rounded-full border px-2 text-[10px] font-medium',
                                isActive
                                  ? 'border-white/30 bg-white/10 text-slate-50'
                                  : 'border-slate-200 bg-slate-50 text-slate-500',
                              ].join(' ')}
                            >
                              {isActive ? '편집 중' : '열기'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(card.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[11px] text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {selected ? '명함 편집하기' : '새 명함 만들기'}
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  기본 정보와 스타일을 입력하면 오른쪽에서 즉시 미리보기가 업데이트됩니다.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm md:p-5">
              <CardEditor initialValue={selected} onSave={handleSave} defaultStyle={defaultStyle} />
            </div>
          </section>
        </div>
      </main>

      {user && showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <ProfileForm
              userEmail={user.email ?? ''}
              initialProfile={profile}
              onSaved={(saved) => {
                setProfile(saved);
                setShowProfile(false);
              }}
              onClose={() => setShowProfile(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}


