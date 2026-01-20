import React, { useState, useEffect } from 'react';
import type { ReceivedCard, Folder } from '../types';

type Props = {
  card: ReceivedCard | null;
  folders: Folder[];
  onUpdate: (
    id: string,
    update: { tags?: string[]; folder_id?: string | null; memo?: string | null },
  ) => Promise<void>;
};

export function ReceivedCardDetail({ card, folders, onUpdate }: Props) {
  const [memo, setMemo] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (card) {
      setMemo(card.memo ?? '');
      setTags(card.tags ?? []);
      setFolderId(card.folder_id);
      setIsEditing(false);
    }
  }, [card]);

  if (!card) {
    return (
      <div className="w-full md:w-80">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-3xl">
              👤
            </div>
            <p className="text-sm font-medium text-slate-700">
              누군가를 선택해보세요
            </p>
            <p className="text-xs text-slate-500">
              다시 연결하고 싶은 사람이 있나요?
            </p>
          </div>
        </div>
      </div>
    );
  }

  const snapshot = card.snapshot;

  const handleSave = async () => {
    await onUpdate(card.id, {
      memo: memo.trim() || null,
      tags,
      folder_id: folderId,
    });
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="w-full md:w-80">
      {/* 데스크탑용 헤더 */}
      <div className="mb-6 hidden items-center justify-between md:flex">
        <h3 className="text-xl font-semibold text-slate-900">상세 정보</h3>
        {isEditing ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-2xl bg-primary-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-primary-700"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setMemo(card.memo ?? '');
                setTags(card.tags ?? []);
                setFolderId(card.folder_id);
              }}
              className="rounded-2xl border-none bg-slate-100 px-5 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-200"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-2xl border-none bg-slate-100 px-5 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            편집
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Primary: 이름 + 직무 */}
        <div>
          <p className="text-2xl font-semibold leading-tight text-slate-900">
            {snapshot.display_name || '이름 없음'}
          </p>
          {snapshot.headline && (
            <p className="mt-2 text-base leading-relaxed text-slate-500">{snapshot.headline}</p>
          )}
          {snapshot.organization && (
            <p className="mt-1 text-base leading-relaxed text-slate-500">{snapshot.organization}</p>
          )}
        </div>

        {/* 연락처 섹션 */}
        {(snapshot.email || snapshot.phone || snapshot.links) && (
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <p className="text-sm font-medium text-slate-400">연락처</p>
            <div className="space-y-2">
              {snapshot.email && (
                <a
                  href={`mailto:${snapshot.email}`}
                  className="flex min-h-[48px] items-center rounded-2xl bg-slate-50 px-4 text-base text-primary-600 transition hover:bg-slate-100"
                >
                  {snapshot.email}
                </a>
              )}
              {snapshot.phone && (
                <a
                  href={`tel:${snapshot.phone}`}
                  className="flex min-h-[48px] items-center rounded-2xl bg-slate-50 px-4 text-base text-primary-600 transition hover:bg-slate-100"
                >
                  {snapshot.phone}
                </a>
              )}
              {snapshot.links && (
                <div className="space-y-2">
                  {snapshot.links.instagram && (
                    <a
                      href={snapshot.links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[48px] items-center rounded-2xl bg-slate-50 px-4 text-base font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Instagram
                    </a>
                  )}
                  {snapshot.links.github && (
                    <a
                      href={snapshot.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[48px] items-center rounded-2xl bg-slate-50 px-4 text-base font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      GitHub
                    </a>
                  )}
                  {snapshot.links.website && (
                    <a
                      href={snapshot.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[48px] items-center rounded-2xl bg-slate-50 px-4 text-base font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 폴더 & 태그 섹션 */}
        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div>
            <p className="text-sm font-medium text-slate-400">폴더</p>
            {isEditing ? (
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="mt-3 w-full rounded-2xl border-none bg-slate-50 px-5 py-4 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">폴더 없음</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-3 text-base text-slate-700">
                {folderId
                  ? folders.find((f) => f.id === folderId)?.name || '알 수 없음'
                  : '폴더 없음'}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-400">태그</p>
            {isEditing ? (
              <div className="mt-3 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 transition hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="태그 추가"
                    className="flex-1 rounded-2xl border-none bg-slate-50 px-5 py-4 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-2xl bg-primary-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-primary-700"
                  >
                    추가
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">태그 없음</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 메모 섹션 */}
        <div className="border-t border-slate-100 pt-6">
          <p className="text-sm font-medium text-slate-400">메모</p>
          {isEditing ? (
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="이 사람과 어떤 인연이었나요?"
              rows={5}
              className="mt-3 w-full rounded-2xl border-none bg-slate-50 px-5 py-4 text-base leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-700">
              {memo || (
                <span className="text-slate-400">이 사람과 어떤 인연이었나요?</span>
              )}
            </p>
          )}
        </div>

        {/* 모바일용 편집 버튼 */}
        <div className="flex gap-3 border-t border-slate-100 pt-6 md:hidden">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-2xl bg-primary-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-primary-700"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setMemo(card.memo ?? '');
                  setTags(card.tags ?? []);
                  setFolderId(card.folder_id);
                }}
                className="flex-1 rounded-2xl border-none bg-slate-100 px-5 py-4 text-base font-medium text-slate-700 transition hover:bg-slate-200"
              >
                취소
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full rounded-2xl border-none bg-slate-100 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              편집
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

