import React, { useState } from 'react';
import type { Folder } from '../types';

type Props = {
  folders: Folder[];
  selectedFolderId: string | null | 'all' | 'unfolder';
  loading: boolean;
  onCreateFolder: (name: string) => Promise<void>;
  onSelectFolder: (folderId: string | null | 'all' | 'unfolder') => void;
  onDeleteFolder: (id: string) => Promise<void>;
};

export function FoldersList({
  folders,
  selectedFolderId,
  loading,
  onCreateFolder,
  onSelectFolder,
  onDeleteFolder,
}: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreating(false);
  };

  return (
    <aside className="w-full md:w-48">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            폴더
          </h2>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <p className="text-xs text-slate-500">로딩 중...</p>
          </div>
        ) : (
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => onSelectFolder('all')}
                className={[
                  'w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition',
                  selectedFolderId === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                전체
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectFolder('unfolder')}
                className={[
                  'w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition',
                  selectedFolderId === 'unfolder'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                폴더 없음
              </button>
            </li>
            {folders.map((folder) => {
              const isActive = selectedFolderId === folder.id;
              return (
                <li key={folder.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectFolder(folder.id)}
                    className={[
                      'flex-1 rounded-lg px-3 py-2 text-left text-xs font-medium transition',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {folder.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFolder(folder.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded text-[10px] text-slate-400 hover:bg-red-50 hover:text-red-500">
                      ×
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {isCreating ? (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleCreate();
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFolderName('');
                }
              }}
              placeholder="폴더 이름"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="flex-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                만들기
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewFolderName('');
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            + 폴더 추가
          </button>
        )}
      </div>
    </aside>
  );
}

