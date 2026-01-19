import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardEditor } from '../features/cards/components/CardEditor';
import type { CardData } from '../features/cards/types';
import { CardsList } from '../features/cards/components/CardsList';
import { useAuth } from '../features/auth/hooks/useAuth';
import { AppLayout } from '../shared/ui/AppLayout';
import { getMyProfile, type Profile } from '../features/profile/api/profileApi';
import { getMyCards, createCard, updateCard, deleteCard } from '../features/cards/api/cardsApi';
import { ProfileForm } from '../features/profile/components/ProfileForm';
import { ProfileSection } from '../features/profile/components/ProfileSection';
import { ContactsPage } from '../features/contacts/components/ContactsPage';

type Tab = 'my-cards' | 'received-cards';

export function AppPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('my-cards');
  const [cards, setCards] = useState([] as CardData[]);
  const [selectedId, setSelectedId] = useState(null as string | null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [profile, setProfile] = useState(null as Profile | null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // 로그인 체크
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // 프로필 로드
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

  // 카드 로드
  useEffect(() => {
    let ignore = false;
    const loadCards = async () => {
      if (!user) {
        setCards([]);
        return;
      }

      setCardsLoading(true);
      try {
        const data = await getMyCards();
        if (!ignore) {
          console.log('[AppPage] 카드 로드 완료:', data.length, '개');
          setCards(data);
          // 카드가 없을 때만 새 명함 만들기 모드로 진입
          // 카드가 있으면 첫 번째 카드를 선택하지 않고 빈 상태 유지
          // (사용자가 명시적으로 선택하거나 '새 명함 만들기' 버튼을 클릭할 때까지)
          if (data.length === 0) {
            setSelectedId(null);
          } else if (selectedId === null && data.length > 0) {
            // 이미 선택된 카드가 없고 카드가 있으면 선택하지 않음
            // (이전에 선택된 카드가 있으면 유지)
          }
        }
      } catch (err: any) {
        if (!ignore) {
          console.error('[AppPage] 카드 로드 오류:', err);
          setError('명함을 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) {
          setCardsLoading(false);
        }
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
      let savedCard: CardData;

      if (existing) {
        savedCard = await updateCard(card);
        setCards((prev) =>
          prev.map((c) => (c.id === existing.id ? savedCard : c)),
        );
        setSelectedId(savedCard.id);
      } else {
        savedCard = await createCard(card);
        setCards((prev) => [savedCard, ...prev]);
        setSelectedId(savedCard.id);
      }
    } catch (err: any) {
      console.error('[AppPage] 저장 오류:', err);
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
      await deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (err: any) {
      console.error('[AppPage] 삭제 오류:', err);
      setError(`삭제 중 오류가 발생했습니다: ${err?.message ?? '알 수 없는 오류'}`);
    } finally {
      setCardsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">확인 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout
      user={user}
      profile={profile}
      onNewCard={() => {
        setActiveTab('my-cards');
        setSelectedId(null);
      }}
    >
      {/* 프로필 정보 섹션 */}
      {profile && (
        <ProfileSection
          profile={profile}
          onEditClick={() => setShowProfileEdit(true)}
        />
      )}

      {/* 탭 네비게이션 */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('my-cards')}
            className={[
              'px-4 py-2 text-sm font-medium transition',
              activeTab === 'my-cards'
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            내 명함
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('received-cards')}
            className={[
              'px-4 py-2 text-sm font-medium transition',
              activeTab === 'received-cards'
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            받은 명함
          </button>
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'my-cards' ? (
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
          <CardsList
            cards={cards}
            selectedId={selectedId}
            loading={cardsLoading}
            error={error}
            onSelect={setSelectedId}
            onDelete={handleDelete}
          />

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
      ) : (
        <ContactsPage />
      )}

      {/* 프로필 수정 모달 */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <ProfileForm
              userEmail={user?.email ?? ''}
              initialProfile={profile}
              onSaved={async (saved) => {
                setProfile(saved);
                setShowProfileEdit(false);
              }}
              onClose={() => setShowProfileEdit(false)}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}

