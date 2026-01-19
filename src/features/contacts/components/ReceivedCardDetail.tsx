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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">상세 정보</h3>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              편집
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* 명함 정보 */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500">이름</p>
              <p className="mt-1.5 text-base font-semibold text-slate-900">
                {snapshot.display_name || '이름 없음'}
              </p>
            </div>
            {snapshot.headline && (
              <div>
                <p className="text-xs font-medium text-slate-500">한 줄 소개</p>
                <p className="mt-1.5 text-sm text-slate-700">{snapshot.headline}</p>
              </div>
            )}
            {snapshot.organization && (
              <div>
                <p className="text-xs font-medium text-slate-500">소속</p>
                <p className="mt-1.5 text-sm text-slate-700">{snapshot.organization}</p>
              </div>
            )}
            {snapshot.email && (
              <div>
                <p className="text-xs font-medium text-slate-500">이메일</p>
                <a
                  href={`mailto:${snapshot.email}`}
                  className="mt-1.5 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {snapshot.email}
                </a>
              </div>
            )}
            {snapshot.phone && (
              <div>
                <p className="text-xs font-medium text-slate-500">전화번호</p>
                <a
                  href={`tel:${snapshot.phone}`}
                  className="mt-1.5 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {snapshot.phone}
                </a>
              </div>
            )}
            {snapshot.links && (
              <div>
                <p className="text-xs font-medium text-slate-500">링크</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {snapshot.links.instagram && (
                    <a
                      href={snapshot.links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                    >
                      Instagram
                    </a>
                  )}
                  {snapshot.links.github && (
                    <a
                      href={snapshot.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                    >
                      GitHub
                    </a>
                  )}
                  {snapshot.links.website && (
                    <a
                      href={snapshot.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                    >
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 폴더 */}
          <div>
            <p className="text-xs font-medium text-slate-500">폴더</p>
            {isEditing ? (
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">폴더 없음</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1.5 text-sm font-medium text-slate-700">
                {folderId
                  ? folders.find((f) => f.id === folderId)?.name || '알 수 없음'
                  : '폴더 없음'}
              </p>
            )}
          </div>

          {/* 태그 */}
          <div>
            <p className="text-xs font-medium text-slate-500">태그</p>
            {isEditing ? (
              <div className="mt-2 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-primary-400 transition hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
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
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                  >
                    추가
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-700"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">태그 없음</p>
                )}
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <p className="text-xs font-medium text-slate-500">메모</p>
            {isEditing ? (
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="이 사람과 어떤 인연이었나요?"
                rows={4}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            ) : (
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                {memo || (
                  <span className="text-slate-400">이 사람과 어떤 인연이었나요?</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

