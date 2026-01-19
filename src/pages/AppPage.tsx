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
import { BottomTabNavigation } from '../shared/ui/BottomTabNavigation';
import { FloatingActionButton } from '../shared/ui/FloatingActionButton';
import { FullScreenModal } from '../shared/ui/FullScreenModal';
import { BottomSheet } from '../shared/ui/BottomSheet';
import { ReceivedCardDetail } from '../features/contacts/components/ReceivedCardDetail';
import { ReceivedCardsList } from '../features/contacts/components/ReceivedCardsList';
import {
  getReceivedCards,
  getFolders,
  createFolder,
  updateReceivedCard,
  deleteReceivedCard,
  deleteFolder,
  type ReceivedCard,
  type Folder,
} from '../features/contacts/api/contactsApi';
import { generateMockData, clearMockData } from '../features/contacts/utils/mockData';

type Tab = 'home' | 'cards' | 'exchange' | 'profile';

export function AppPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [cards, setCards] = useState([] as CardData[]);
  const [selectedId, setSelectedId] = useState(null as string | null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [profile, setProfile] = useState(null as Profile | null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  
  // 받은 명함 관련 상태
  const [receivedCards, setReceivedCards] = useState<ReceivedCard[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | 'all' | 'unfolder'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'oldest'>('newest');
  
  // 모달 상태
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [showCardEditor, setShowCardEditor] = useState(false);

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

  // 받은 명함 로드
  useEffect(() => {
    let ignore = false;
    const loadReceivedCards = async () => {
      if (!user) return;
      try {
        const folderId =
          selectedFolderId === 'all' || selectedFolderId === 'unfolder'
            ? selectedFolderId === 'unfolder'
              ? null
              : undefined
            : selectedFolderId;
        const data = await getReceivedCards(folderId);
        if (!ignore) {
          setReceivedCards(data);
        }
      } catch (err: any) {
        console.error('[AppPage] 받은 명함 로드 오류:', err);
      }
    };
    void loadReceivedCards();
    return () => {
      ignore = true;
    };
  }, [user, selectedFolderId]);

  // 폴더 로드
  useEffect(() => {
    let ignore = false;
    const loadFolders = async () => {
      if (!user) return;
      try {
        const data = await getFolders();
        if (!ignore) {
          setFolders(data);
        }
      } catch (err: any) {
        console.error('[AppPage] 폴더 로드 오류:', err);
      }
    };
    void loadFolders();
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
  const selectedCard = receivedCards.find((c) => c.id === selectedCardId) ?? null;

  // 필터링 및 정렬
  const filteredAndSortedCards = useMemo(() => {
    let filtered = receivedCards;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = receivedCards.filter((card) => {
        const snapshot = card.snapshot;
        return (
          snapshot.display_name?.toLowerCase().includes(query) ||
          snapshot.headline?.toLowerCase().includes(query) ||
          snapshot.organization?.toLowerCase().includes(query) ||
          snapshot.email?.toLowerCase().includes(query) ||
          snapshot.phone?.toLowerCase().includes(query) ||
          card.memo?.toLowerCase().includes(query) ||
          card.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.snapshot.display_name || '';
        const nameB = b.snapshot.display_name || '';
        return nameA.localeCompare(nameB, 'ko');
      } else if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

    return sorted;
  }, [receivedCards, searchQuery, sortBy]);

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
        setShowCardEditor(false);
      }
    } catch (err: any) {
      console.error('[AppPage] 삭제 오류:', err);
      setError(`삭제 중 오류가 발생했습니다: ${err?.message ?? '알 수 없는 오류'}`);
    } finally {
      setCardsLoading(false);
    }
  };

  const handleUpdateReceivedCard = async (
    id: string,
    update: { tags?: string[]; folder_id?: string | null; memo?: string | null },
  ) => {
    try {
      const updated = await updateReceivedCard(id, update);
      setReceivedCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err: any) {
      console.error('[AppPage] 받은 명함 수정 오류:', err);
      throw err;
    }
  };

  const handleDeleteReceivedCard = async (id: string) => {
    const card = receivedCards.find((c) => c.id === id);
    if (!card) return;
    if (!confirm(`"${card.snapshot.display_name || '이름 없음'}" 명함을 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await deleteReceivedCard(id);
      setReceivedCards((prev) => prev.filter((c) => c.id !== id));
      if (selectedCardId === id) {
        setSelectedCardId(null);
        setShowCardDetail(false);
      }
    } catch (err: any) {
      console.error('[AppPage] 받은 명함 삭제 오류:', err);
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
        setActiveTab('cards');
        setSelectedId(null);
        setShowCardEditor(true);
      }}
    >
      <div className="pb-20 md:pb-8">
        {/* 홈 탭 */}
        {activeTab === 'home' && (
          <div className="space-y-6">
      {profile && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">안녕하세요 👋</h2>
                </div>
                <p className="text-sm text-slate-600">
                  오늘 새로운 인연을 만나보세요
                </p>
              </div>
            )}

            <div>
              <h3 className="mb-3 text-base font-semibold text-slate-900">최근 받은 명함</h3>
              {filteredAndSortedCards.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {filteredAndSortedCards.slice(0, 5).map((card) => (
          <button
                      key={card.id}
            type="button"
                      onClick={() => {
                        setSelectedCardId(card.id);
                        setShowCardDetail(true);
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-md transition hover:shadow-lg"
                    >
                      <p className="font-semibold text-slate-900">
                        {card.snapshot.display_name || '이름 없음'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {card.snapshot.headline || card.snapshot.organization || '설명 없음'}
                      </p>
          </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm text-slate-500">아직 받은 명함이 없어요</p>
                </div>
              )}
            </div>
      </div>
        )}

        {/* 명함 탭 */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            <div className="md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] md:gap-6">
          <CardsList
            cards={cards}
            selectedId={selectedId}
            loading={cardsLoading}
            error={error}
                onSelect={(id) => {
                  setSelectedId(id);
                  setShowCardEditor(true);
                }}
            onDelete={handleDelete}
          />

              {/* 데스크탑: 우측 패널 */}
              <section className="hidden space-y-4 md:block">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                  <CardEditor
                    initialValue={selected}
                    onSave={async (card) => {
                      await handleSave(card);
                      setShowCardEditor(false);
                    }}
                    defaultStyle={defaultStyle}
                  />
              </div>
              </section>
            </div>
          </div>
        )}

        {/* 받은 명함 전체 보기 (홈에서 더보기) */}
        {activeTab === 'home' && filteredAndSortedCards.length > 5 && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                // 받은 명함 전체를 보는 별도 뷰로 이동 (임시로 cards 탭 사용)
                // TODO: 받은 명함 전용 탭 추가
              }}
              className="w-full rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
            >
              모든 받은 명함 보기 →
            </button>
          </div>
        )}

        {/* 교환 탭 */}
        {activeTab === 'exchange' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
              <div className="mb-4 text-4xl">📲</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">명함 교환</h3>
              <p className="text-sm text-slate-500">
                QR 코드나 NFC로 명함을 교환할 수 있어요
              </p>
              <p className="mt-4 text-xs text-slate-400">
                (준비 중입니다)
              </p>
            </div>
          </div>
        )}

        {/* 내정보 탭 */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {profile && (
              <ProfileSection
                profile={profile}
                onEditClick={() => setShowProfileEdit(true)}
              />
            )}
          </div>
        )}
        </div>

      {/* 모바일: 하단 탭 네비게이션 */}
      <BottomTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 모바일: FAB */}
      {activeTab === 'cards' && (
        <FloatingActionButton
          onClick={() => {
            setSelectedId(null);
            setShowCardEditor(true);
          }}
        />
      )}

      {/* 모바일: 명함 편집 모달 */}
      <FullScreenModal
        isOpen={showCardEditor}
        onClose={() => {
          setShowCardEditor(false);
          setSelectedId(null);
        }}
        title={selected ? '명함 편집하기' : '새 명함 만들기'}
      >
        <CardEditor
          initialValue={selected}
          onSave={async (card) => {
            await handleSave(card);
            setShowCardEditor(false);
          }}
          defaultStyle={defaultStyle}
        />
      </FullScreenModal>

      {/* 모바일: 받은 명함 상세 Bottom Sheet */}
      <BottomSheet
        isOpen={showCardDetail}
        onClose={() => {
          setShowCardDetail(false);
          setSelectedCardId(null);
        }}
        title="상세 정보"
      >
        {selectedCard && (
          <ReceivedCardDetail
            card={selectedCard}
            folders={folders}
            onUpdate={handleUpdateReceivedCard}
          />
        )}
      </BottomSheet>

      {/* 프로필 수정 모달 */}
      {showProfileEdit && (
        <FullScreenModal
          isOpen={showProfileEdit}
          onClose={() => setShowProfileEdit(false)}
          title="프로필 수정"
        >
            <ProfileForm
              userEmail={user?.email ?? ''}
              initialProfile={profile}
              onSaved={async (saved) => {
                setProfile(saved);
                setShowProfileEdit(false);
              }}
              onClose={() => setShowProfileEdit(false)}
            />
        </FullScreenModal>
      )}
    </AppLayout>
  );
}

