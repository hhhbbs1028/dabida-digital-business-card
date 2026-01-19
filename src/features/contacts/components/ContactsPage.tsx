import React, { useEffect, useState, useMemo } from 'react';
import { ReceivedCardsList } from './ReceivedCardsList';
import { ReceivedCardDetail } from './ReceivedCardDetail';
import {
  getReceivedCards,
  getFolders,
  createFolder,
  updateReceivedCard,
  deleteReceivedCard,
  deleteFolder,
  type ReceivedCard,
  type Folder,
} from '../api/contactsApi';
import { generateMockData, clearMockData } from '../utils/mockData';

export function ContactsPage() {
  const [cards, setCards] = useState<ReceivedCard[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | 'all' | 'unfolder'>(
    'all',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingMock, setIsGeneratingMock] = useState(false);
  const [isClearingMock, setIsClearingMock] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'oldest'>('newest');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // 폴더 로드
  useEffect(() => {
    let ignore = false;
    const loadFolders = async () => {
      try {
        const data = await getFolders();
        if (!ignore) {
          setFolders(data);
        }
      } catch (err: any) {
        console.error('[ContactsPage] 폴더 로드 오류:', err);
        if (!ignore) {
          setError('폴더를 불러오지 못했습니다.');
        }
      }
    };
    void loadFolders();
    return () => {
      ignore = true;
    };
  }, []);

  // 명함 로드
  useEffect(() => {
    let ignore = false;
    const loadCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const folderId =
          selectedFolderId === 'all' || selectedFolderId === 'unfolder'
            ? selectedFolderId === 'unfolder'
              ? null
              : undefined
            : selectedFolderId;
        const data = await getReceivedCards(folderId);
        if (!ignore) {
          setCards(data);
          // 선택된 명함이 현재 폴더에 없으면 선택 해제
          if (selectedCardId && !data.find((c) => c.id === selectedCardId)) {
            setSelectedCardId(null);
          }
        }
      } catch (err: any) {
        console.error('[ContactsPage] 명함 로드 오류:', err);
        if (!ignore) {
          setError('명함을 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    void loadCards();
    return () => {
      ignore = true;
    };
  }, [selectedFolderId, selectedCardId]);

  // 검색 필터링 및 정렬
  const filteredAndSortedCards = useMemo(() => {
    // 1. 검색 필터링
    let filtered = cards;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = cards.filter((card) => {
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

    // 2. 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        // 가나다순 (이름순)
        const nameA = a.snapshot.display_name || '';
        const nameB = b.snapshot.display_name || '';
        return nameA.localeCompare(nameB, 'ko');
      } else if (sortBy === 'newest') {
        // 추가한 시간순 (최신순)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        // 오래된 순
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

    return sorted;
  }, [cards, searchQuery, sortBy]);

  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = await createFolder({ name });
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (err: any) {
      console.error('[ContactsPage] 폴더 생성 오류:', err);
      setError('폴더를 생성하지 못했습니다.');
      throw err;
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('폴더를 삭제하면 폴더 안의 명함은 "폴더 없음"으로 이동합니다. 계속하시겠습니까?')) {
      return;
    }
    try {
      await deleteFolder(id);
      setFolders(folders.filter((f) => f.id !== id));
      if (selectedFolderId === id) {
        setSelectedFolderId('all');
      }
    } catch (err: any) {
      console.error('[ContactsPage] 폴더 삭제 오류:', err);
      setError('폴더를 삭제하지 못했습니다.');
    }
  };

  const handleUpdateCard = async (
    id: string,
    update: { tags?: string[]; folder_id?: string | null; memo?: string | null },
  ) => {
    try {
      const updated = await updateReceivedCard(id, update);
      setCards(cards.map((c) => (c.id === id ? updated : c)));
      // 폴더가 변경되었고 현재 폴더가 아니면 목록에서 제거
      if (update.folder_id !== undefined && update.folder_id !== selectedFolderId) {
        setSelectedCardId(null);
      }
    } catch (err: any) {
      console.error('[ContactsPage] 명함 수정 오류:', err);
      setError('명함을 수정하지 못했습니다.');
      throw err;
    }
  };

  const handleDeleteCard = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    if (!confirm(`"${card.snapshot.display_name || '이름 없음'}" 명함을 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await deleteReceivedCard(id);
      setCards(cards.filter((c) => c.id !== id));
      if (selectedCardId === id) {
        setSelectedCardId(null);
      }
    } catch (err: any) {
      console.error('[ContactsPage] 명함 삭제 오류:', err);
      setError('명함을 삭제하지 못했습니다.');
    }
  };

  const handleGenerateMockData = async () => {
    if (!confirm('테스트용 mock 데이터를 생성하시겠습니까?\n\n(기존 데이터는 유지됩니다)')) {
      return;
    }
    setIsGeneratingMock(true);
    setError(null);
    try {
      await generateMockData();
      // 데이터 새로고침
      const folderId =
        selectedFolderId === 'all' || selectedFolderId === 'unfolder'
          ? selectedFolderId === 'unfolder'
            ? null
            : undefined
          : selectedFolderId;
      const newCards = await getReceivedCards(folderId);
      const newFolders = await getFolders();
      setCards(newCards);
      setFolders(newFolders);
      alert('테스트 데이터가 생성되었습니다!');
    } catch (err: any) {
      console.error('[ContactsPage] Mock 데이터 생성 오류:', err);
      setError('테스트 데이터 생성에 실패했습니다: ' + (err?.message ?? '알 수 없는 오류'));
    } finally {
      setIsGeneratingMock(false);
    }
  };

  const handleClearMockData = async () => {
    if (!confirm('모든 받은 명함과 폴더를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!')) {
      return;
    }
    setIsClearingMock(true);
    setError(null);
    try {
      await clearMockData();
      setCards([]);
      setFolders([]);
      setSelectedCardId(null);
      setSelectedFolderId('all');
      alert('모든 데이터가 삭제되었습니다.');
    } catch (err: any) {
      console.error('[ContactsPage] Mock 데이터 삭제 오류:', err);
      setError('데이터 삭제에 실패했습니다: ' + (err?.message ?? '알 수 없는 오류'));
    } finally {
      setIsClearingMock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 테스트용 Mock 데이터 버튼 (개발 모드) */}
      {import.meta.env.DEV && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-amber-900">🧪 테스트 모드</h3>
              <p className="mt-1 text-xs text-amber-700">
                받은 명함 기능을 테스트하기 위한 mock 데이터를 생성할 수 있습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGenerateMockData}
                disabled={isGeneratingMock || isClearingMock}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingMock ? '생성 중...' : 'Mock 데이터 생성'}
              </button>
              <button
                type="button"
                onClick={handleClearMockData}
                disabled={isGeneratingMock || isClearingMock}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isClearingMock ? '삭제 중...' : '모두 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 폴더 탭/칩 필터 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">폴더</h3>
          {!isCreatingFolder && (
            <button
              type="button"
              onClick={() => setIsCreatingFolder(true)}
              className="rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              + 폴더 추가
            </button>
          )}
        </div>

        {isCreatingFolder ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (newFolderName.trim()) {
                    void handleCreateFolder(newFolderName.trim());
                  }
                } else if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              placeholder="폴더 이름"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                if (newFolderName.trim()) {
                  void handleCreateFolder(newFolderName.trim());
                }
              }}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              만들기
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedFolderId('all')}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                selectedFolderId === 'all'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              ].join(' ')}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setSelectedFolderId('unfolder')}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                selectedFolderId === 'unfolder'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              ].join(' ')}
            >
              폴더 없음
            </button>
            {folders.map((folder) => {
              const isActive = selectedFolderId === folder.id;
              return (
                <div key={folder.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-semibold transition',
                      isActive
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    ].join(' ')}
                  >
                    {folder.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="ml-1.5 hidden items-center justify-center rounded-full bg-red-100 p-1 text-xs text-red-600 transition hover:bg-red-200 group-hover:inline-flex"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 검색 바 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이름, 소속, 이메일, 전화번호, 메모, 태그로 검색..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {/* 메인 레이아웃 */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <ReceivedCardsList
          cards={filteredAndSortedCards}
          selectedId={selectedCardId}
          loading={loading}
          error={error}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onSelect={setSelectedCardId}
          onDelete={handleDeleteCard}
        />

        <ReceivedCardDetail
          card={selectedCard}
          folders={folders}
          onUpdate={handleUpdateCard}
        />
      </div>
    </div>
  );
}

