import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import { ShareCardModal } from '../features/share/components/ShareCardModal';
import { QRScanner } from '../features/share/components/QRScanner';
import {
  getReceivedCards,
  getFolders,
  createFolder,
  updateReceivedCard,
  deleteReceivedCard,
  deleteFolder,
} from '../features/contacts/api/contactsApi';
import type { ReceivedCard, Folder } from '../features/contacts/types';
import { SignOutButton } from '../features/auth/components/AuthButtons';
import { useToast } from '../shared/ui/Toast';
import { CommunityPage } from '../features/community/pages/CommunityPage';
import { createOrGetDm } from '../features/community/api/chatsApi';
import { ChatTab } from '../features/community/components/ChatTab';
import { supabase } from '../shared/infrastructure/supabaseClient';

type Tab = 'home' | 'cards' | 'received' | 'exchange' | 'community' | 'profile';
type ExchangeSubTab = 'give' | 'receive';

export function AppPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
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
  const [shareTargetCardId, setShareTargetCardId] = useState<string | null>(null);
  const [showShareSelector, setShowShareSelector] = useState(false);
  const [exchangeSubTab, setExchangeSubTab] = useState<ExchangeSubTab>('give');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [processingLink, setProcessingLink] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);

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

  // 탭 변경 핸들러 (QR 스캐너 자동 닫기)
  const handleTabChange = (tab: Tab) => {
    setShowQRScanner(false); // 항상 카메라 닫기
    setActiveTab(tab);
  };

  const defaultStyle = useMemo(() => {
    if (!profile) return undefined;
    if (!profile.selected_template_id) return undefined;
    return {
      template_id: profile.selected_template_id ?? 1,
      theme_color: profile.selected_theme_color ?? '#111827',
      font_family: (profile.selected_font_family as any) ?? 'sans',
      orientation: 'horizontal' as const,
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

  // URL에서 cardId 추출 함수
  const extractCardIdFromUrl = (url: string): string | null => {
    // /c/:cardId 형식 매칭
    const match = url.match(/\/c\/([a-f0-9-]+)/i);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  };

  // QR 스캔 성공 핸들러
  const handleQRScanSuccess = useCallback((url: string) => {
    console.log('[AppPage] QR 스캔 성공:', url);
    const cardId = extractCardIdFromUrl(url);
    if (cardId) {
      // PublicCardPage로 이동 (자동 저장 플로우)
      navigate(`/c/${cardId}?intent=saveReceived&sourceCardId=${cardId}`);
    } else {
      // 유효하지 않은 URL
      showToast('유효하지 않은 명함 링크입니다.', 'error');
      setShowQRScanner(false);
    }
  }, [navigate, showToast]);

  // 링크 붙여넣기 처리
  const handleLinkSubmit = async () => {
    if (!linkInput.trim()) {
      showToast('링크를 입력해주세요.', 'error');
      return;
    }

    setProcessingLink(true);
    try {
      const cardId = extractCardIdFromUrl(linkInput.trim());
      if (!cardId) {
        showToast('유효하지 않은 명함 링크입니다. /c/카드ID 형식의 링크를 입력해주세요.', 'error');
        return;
      }

      // PublicCardPage로 이동 (자동 저장 플로우)
      navigate(`/c/${cardId}?intent=saveReceived&sourceCardId=${cardId}`);
      setLinkInput('');
    } catch (err: any) {
      console.error('[AppPage] 링크 처리 오류:', err);
      showToast('링크 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setProcessingLink(false);
    }
  };

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

  const handleStartChat = async (card: ReceivedCard) => {
    try {
      // source_card_id가 있으면 cards 테이블에서 user_id 조회
      if (!card.source_card_id) {
        showToast('이 명함으로는 채팅할 수 없습니다. (명함 교환이 필요합니다)', 'error');
        return;
      }

      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('user_id')
        .eq('id', card.source_card_id)
        .single();

      if (cardError || !cardData) {
        console.error('[AppPage] 명함 조회 오류:', cardError);
        showToast('명함 정보를 찾을 수 없습니다.', 'error');
        return;
      }

      const targetUserId = (cardData as { user_id: string }).user_id;
      
      // UUID 형식 검증
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
        showToast('채팅할 수 없는 사용자입니다.', 'error');
        return;
      }

      // 대화방 생성 또는 조회
      const conversation = await createOrGetDm(targetUserId);
      setChatConversationId(conversation.id);
      setShowChatModal(true);
    } catch (err: any) {
      console.error('[AppPage] 채팅 시작 오류:', err);
      showToast(err.message || '채팅을 시작할 수 없습니다.', 'error');
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
            {/* 간단한 인사 */}
            <div>
              <h2 className="text-2xl font-semibold leading-tight text-slate-900">👋 안녕하세요</h2>
              <p className="mt-2 text-base leading-relaxed text-slate-500">
                오늘 받은 명함
              </p>
            </div>

            <div>
              {filteredAndSortedCards.slice(0, 5).length > 0 ? (
                <div className="space-y-2">
                  {filteredAndSortedCards.slice(0, 5).map((card) => {
                    const displayName = card.snapshot.display_name || '이름 없음';
                    const initials = displayName.substring(0, 2).toUpperCase();
                    const canChat = !!card.source_card_id;
                    return (
                      <div key={card.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCardId(card.id);
                            setShowCardDetail(true);
                          }}
                          className="flex flex-1 min-h-[84px] items-center gap-4 rounded-2xl bg-white px-6 py-5 text-left transition active:bg-slate-50 touch-manipulation"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-base font-semibold text-slate-700">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xl font-semibold leading-tight text-slate-900">
                              {displayName}
                            </p>
                            <p className="mt-1.5 text-base leading-relaxed text-slate-500">
                              {card.snapshot.headline || card.snapshot.organization || '설명 없음'}
                            </p>
                          </div>
                        </button>
                        {canChat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChat(card);
                            }}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 transition hover:bg-primary-200 active:bg-primary-300 touch-manipulation"
                            title="채팅하기"
                          >
                            💬
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {filteredAndSortedCards.length > 5 && (
          <button
            type="button"
                      onClick={() => setActiveTab('received')}
                      className="w-full rounded-2xl bg-slate-50 px-6 py-4 text-base font-medium text-slate-600 transition active:bg-slate-100 touch-manipulation"
          >
                      전체보기 →
          </button>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-12 text-center">
                  <p className="text-base text-slate-500">아직 받은 명함이 없어요</p>
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
            onShare={(id) => {
              setShareTargetCardId(id);
            }}
          />

              {/* 데스크탑: 우측 패널 */}
              <section className="hidden space-y-4 md:block">
                <div className="rounded-2xl bg-white p-6">
                  <CardEditor
                    initialValue={selected}
                    onSave={handleSave}
                    defaultStyle={defaultStyle}
                    avatarUrl={profile?.avatar_url}
                  />
              </div>
              </section>
            </div>
          </div>
        )}

        {/* 받은 명함 전체보기 탭 */}
        {activeTab === 'received' && (
          <div className="space-y-5">
            {/* 리스트 헤더 - 한 줄 통합 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">받은 명함</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {filteredAndSortedCards.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const options = ['newest', 'oldest', 'name'];
                  const currentIndex = options.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setSortBy(options[nextIndex] as 'name' | 'newest' | 'oldest');
                }}
                className="rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {sortBy === 'newest' ? '최신순 ▾' : sortBy === 'oldest' ? '오래된순 ▾' : '가나다순 ▾'}
              </button>
            </div>

            {/* 폴더 필터 - 칩 + 편집 패턴 */}
            <div className="rounded-2xl bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">폴더</h3>
                <button
                  type="button"
                  onClick={async () => {
                    const name = prompt('폴더 이름을 입력하세요:');
                    if (name?.trim()) {
                      try {
                        const newFolder = await createFolder({ name: name.trim() });
                        setFolders([...folders, newFolder]);
                      } catch (err) {
                        alert('폴더 생성에 실패했습니다.');
                      }
                    }
                  }}
                  className="text-base font-medium text-primary-600 transition hover:text-primary-700"
                >
                  + 추가
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedFolderId('all')}
                  className={[
                    'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                    selectedFolderId === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-700',
                  ].join(' ')}
                >
                  전체
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFolderId('unfolder')}
                  className={[
                    'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                    selectedFolderId === 'unfolder'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-700',
                  ].join(' ')}
                >
                  폴더 없음
                </button>
                {folders.map((folder) => {
                  const isActive = selectedFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={[
                        'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      {folder.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 검색 바 - 토스 스타일 */}
            <div className="rounded-2xl bg-white p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름/소속/태그 검색"
                className="h-12 w-full rounded-2xl border-none bg-slate-50 px-5 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <ReceivedCardsList
              onChat={handleStartChat}
              cards={filteredAndSortedCards}
              selectedId={selectedCardId}
              loading={false}
              error={null}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onSelect={(id) => {
                setSelectedCardId(id);
                setShowCardDetail(true);
              }}
              onDelete={handleDeleteReceivedCard}
            />
          </div>
        )}

        {/* 교환 탭 */}
        {activeTab === 'exchange' && (
          <div className="space-y-6">
            {/* 서브 탭 */}
            <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2">
              <button
                type="button"
                onClick={() => {
                  setShowQRScanner(false); // 카메라 즉시 닫기
                  setExchangeSubTab('give');
                }}
                className={[
                  'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                  exchangeSubTab === 'give'
                    ? 'bg-slate-900 text-white'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                명함 주기
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQRScanner(false); // 카메라 즉시 닫기
                  setExchangeSubTab('receive');
                }}
                className={[
                  'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                  exchangeSubTab === 'receive'
                    ? 'bg-slate-900 text-white'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                명함 받기
              </button>
            </div>

            {/* 명함 주기 탭 */}
            {exchangeSubTab === 'give' && (
              <div className="rounded-2xl bg-white p-8 text-center md:p-12">
                <div className="mb-4 text-4xl md:mb-6 md:text-5xl">📤</div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900 md:mb-3 md:text-2xl">
                  명함 주기
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 md:text-base">
                  내 명함 중 어떤 걸 줄지 선택하고, QR 코드로 바로 공유해 보세요.
                </p>

                {cards.length === 0 ? (
                  <div className="mt-8 space-y-4">
                    <p className="text-sm text-slate-500">
                      먼저 내 명함을 하나 만들어야 QR 코드를 보여줄 수 있어요.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('cards');
                        setSelectedId(null);
                        setShowCardEditor(true);
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      내 명함 만들러 가기
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <p className="text-sm text-slate-500">
                      여러 장의 명함 중에서 지금 공유할 명함을 선택한 뒤 QR 코드를 열어요.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (cards.length === 1) {
                          setShareTargetCardId(cards[0].id);
                        } else {
                          setShowShareSelector(true);
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      내 명함 QR 열기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 명함 받기 탭 */}
            {exchangeSubTab === 'receive' && (
              <div className="space-y-6">
                {showQRScanner && exchangeSubTab === 'receive' ? (
                  <div key={`qr-scanner-${showQRScanner}`} className="rounded-2xl bg-white p-6">
                    <QRScanner
                      onScanSuccess={handleQRScanSuccess}
                      onClose={() => setShowQRScanner(false)}
                    />
                  </div>
                ) : (
                  <>
                    {/* QR 스캔 섹션 */}
                    <div className="rounded-2xl bg-white p-6">
                  <div className="text-center">
                        <div className="mb-4 text-4xl md:mb-6 md:text-5xl">📷</div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-900 md:mb-3 md:text-2xl">
                          QR 코드 스캔
                    </h3>
                    <p className="mb-6 text-sm leading-relaxed text-slate-500 md:text-base">
                      상대방의 명함 QR 코드를 카메라로 스캔하면 받은 명함에 자동으로 저장됩니다.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowQRScanner(true)}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      📷 QR 코드 스캔 시작
                    </button>
                  </div>
                    </div>

                    {/* 링크 붙여넣기 섹션 */}
                    <div className="rounded-2xl bg-white p-6">
                      <div className="text-center">
                        <div className="mb-4 text-4xl md:mb-6 md:text-5xl">🔗</div>
                        <h3 className="mb-2 text-xl font-semibold text-slate-900 md:mb-3 md:text-2xl">
                          링크로 받기
                        </h3>
                        <p className="mb-4 text-sm leading-relaxed text-slate-500 md:text-base">
                          상대방이 공유한 명함 링크를 붙여넣어 받은 명함에 저장할 수 있습니다.
                        </p>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={linkInput}
                              onChange={(e) => setLinkInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleLinkSubmit();
                                }
                              }}
                              placeholder="https://... 또는 /c/카드ID 형식의 링크"
                              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                              disabled={processingLink}
                            />
                            <button
                              type="button"
                              onClick={handleLinkSubmit}
                              disabled={!linkInput.trim() || processingLink}
                              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {processingLink ? '처리 중...' : '받기'}
                            </button>
                          </div>
                          <p className="text-xs text-slate-400">
                            예: https://yourdomain.com/c/abc-123-def-456 또는 /c/abc-123-def-456
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 커뮤니티 탭 */}
        {activeTab === 'community' && <CommunityPage />}

        {/* 내정보 탭 */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {profile && (
              <ProfileSection
                profile={profile}
                onEditClick={() => setShowProfileEdit(true)}
              />
            )}
            {/* 모바일용 로그아웃 버튼 */}
            <div className="md:hidden">
              <div className="rounded-2xl bg-white p-6">
                <SignOutButton />
              </div>
            </div>
          </div>
        )}
        </div>

      {/* 모바일: 하단 탭 네비게이션 */}
      <BottomTabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

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
          onSave={handleSave}
          defaultStyle={defaultStyle}
          avatarUrl={profile?.avatar_url}
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

      {/* 명함 공유 모달 */}
      <FullScreenModal
        isOpen={!!shareTargetCardId}
        onClose={() => setShareTargetCardId(null)}
        title="명함 공유"
      >
        {shareTargetCardId && (
          <ShareCardModal cardId={shareTargetCardId} onClose={() => setShareTargetCardId(null)} />
        )}
      </FullScreenModal>

      {/* 교환 탭: 공유할 명함 선택 모달 */}
      <FullScreenModal
        isOpen={showShareSelector}
        onClose={() => setShowShareSelector(false)}
        title="공유할 명함 선택"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            지금 상대방에게 보여줄 명함을 선택하세요. 선택한 명함으로 QR 코드를 생성합니다.
          </p>
          <div className="space-y-3">
            {cards.map((card) => {
              const isActive = shareTargetCardId === card.id;
              const displayName = card.display_name || '이름 없음';
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setShareTargetCardId(card.id);
                    setShowShareSelector(false);
                  }}
                  className={[
                    'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="mt-1 truncate text-xs text-inherit opacity-80">
                      {card.headline || card.organization || '설명 없음'}
                    </p>
                  </div>
                  <span className="ml-3 text-xs font-semibold">
                    {isActive ? '선택됨' : '선택'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </FullScreenModal>

      {/* 채팅 모달 */}
      {showChatModal && chatConversationId && (
        <FullScreenModal
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false);
            setChatConversationId(null);
          }}
          title="채팅"
        >
          <ChatTab initialConversationId={chatConversationId} />
        </FullScreenModal>
      )}
    </AppLayout>
  );
}

