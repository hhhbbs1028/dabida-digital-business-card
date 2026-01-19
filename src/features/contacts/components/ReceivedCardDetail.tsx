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
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-xs text-slate-500">명함을 선택하면 상세 정보가 표시됩니다.</p>
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
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">명함 상세</h3>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
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
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              편집
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* 명함 정보 */}
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-slate-500">이름</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {snapshot.display_name || '이름 없음'}
              </p>
            </div>
            {snapshot.headline && (
              <div>
                <p className="text-xs font-medium text-slate-500">직책/한줄소개</p>
                <p className="mt-1 text-sm text-slate-700">{snapshot.headline}</p>
              </div>
            )}
            {snapshot.organization && (
              <div>
                <p className="text-xs font-medium text-slate-500">소속</p>
                <p className="mt-1 text-sm text-slate-700">{snapshot.organization}</p>
              </div>
            )}
            {snapshot.email && (
              <div>
                <p className="text-xs font-medium text-slate-500">이메일</p>
                <a
                  href={`mailto:${snapshot.email}`}
                  className="mt-1 text-sm text-blue-600 hover:underline"
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
                  className="mt-1 text-sm text-blue-600 hover:underline"
                >
                  {snapshot.phone}
                </a>
              </div>
            )}
            {snapshot.links && (
              <div>
                <p className="text-xs font-medium text-slate-500">링크</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {snapshot.links.instagram && (
                    <a
                      href={snapshot.links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Instagram
                    </a>
                  )}
                  {snapshot.links.github && (
                    <a
                      href={snapshot.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      GitHub
                    </a>
                  )}
                  {snapshot.links.website && (
                    <a
                      href={snapshot.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
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
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
              >
                <option value="">폴더 없음</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-sm text-slate-700">
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
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-red-500"
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
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    추가
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
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
                placeholder="메모를 입력하세요..."
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
              />
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {memo || '메모 없음'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

