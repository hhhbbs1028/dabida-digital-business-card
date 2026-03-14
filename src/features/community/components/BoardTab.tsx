import React, { useState, useEffect } from 'react';
import type { Post } from '../types';
import { listPosts, createPost, updatePost, deletePost } from '../api/postsApi';
import { useToast } from '../../../shared/ui/Toast';
import { useAuth } from '../../auth/hooks/useAuth';

export function BoardTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadPosts();
  }, [searchQuery]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const data = await listPosts(params);
      setPosts(data);
    } catch (err: any) {
      console.error('[BoardTab] 게시글 조회 오류:', err);
      showToast('게시글을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('제목과 내용을 입력해주세요.', 'error');
      return;
    }

    try {
      await createPost({ title: title.trim(), content: content.trim(), tags });
      setShowCreateModal(false);
      setTitle('');
      setContent('');
      setTags([]);
      await loadPosts();
      showToast('게시글이 작성되었습니다.', 'success');
    } catch (err: any) {
      console.error('[BoardTab] 게시글 작성 오류:', err);
      showToast('게시글 작성에 실패했습니다.', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editingPost || !title.trim() || !content.trim()) return;

    try {
      await updatePost(editingPost.id, {
        title: title.trim(),
        content: content.trim(),
        tags,
      });
      setEditingPost(null);
      setTitle('');
      setContent('');
      setTags([]);
      await loadPosts();
      showToast('게시글이 수정되었습니다.', 'success');
    } catch (err: any) {
      console.error('[BoardTab] 게시글 수정 오류:', err);
      showToast('게시글 수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      await deletePost(postId);
      await loadPosts();
      showToast('게시글이 삭제되었습니다.', 'success');
    } catch (err: any) {
      console.error('[BoardTab] 게시글 삭제 오류:', err);
      showToast('게시글 삭제에 실패했습니다.', 'error');
    }
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

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const visiblePosts = selectedTag
    ? posts.filter((p) => p.tags.includes(selectedTag))
    : posts;

  return (
    <div className="space-y-5">
      {/* 검색/필터 */}
      <div className="space-y-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="게시글 검색"
          className="w-full rounded-2xl border-none bg-white px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setSelectedTag('')}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                !selectedTag
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              전체
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedTag === tag
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 작성 버튼 */}
      <button
        type="button"
        onClick={() => {
          setShowCreateModal(true);
          setEditingPost(null);
          setTitle('');
          setContent('');
          setTags([]);
        }}
        className="w-full rounded-2xl bg-primary-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-primary-700"
      >
        + 새 게시글 작성
      </button>

      {/* 게시글 리스트 */}
      {loading ? (
        <div className="rounded-2xl bg-white p-12 text-center">
          <p className="text-base text-slate-500">불러오는 중...</p>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center">
          <p className="text-base text-slate-500">게시글이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl bg-white p-6 transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-slate-700">
                    {post.content}
                  </p>
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                {post.author_id === user?.id && (
                  <div className="ml-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPost(post);
                        setTitle(post.title);
                        setContent(post.content);
                        setTags(post.tags);
                        setShowCreateModal(true);
                      }}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-slate-200"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 작성/수정 모달 */}
      {(showCreateModal || editingPost) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-xl font-semibold text-slate-900">
              {editingPost ? '게시글 수정' : '새 게시글 작성'}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용"
                rows={8}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
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
                    className="flex-1 rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    추가
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={editingPost ? handleUpdate : handleCreate}
                  className="flex-1 rounded-2xl bg-primary-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-primary-700"
                >
                  {editingPost ? '수정' : '작성'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPost(null);
                    setTitle('');
                    setContent('');
                    setTags([]);
                  }}
                  className="flex-1 rounded-2xl bg-slate-100 px-5 py-4 text-base font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

