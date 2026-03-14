import React, { useRef, useState, useEffect } from 'react';
import type { Post, CommunityProfile } from '../types';
import { listPosts, createPost, updatePost, deletePost } from '../api/postsApi';
import { useToast } from '../../../shared/ui/Toast';
import { useAuth } from '../../auth/hooks/useAuth';
import { supabase } from '../../../shared/infrastructure/supabaseClient';
import { uploadToStorage } from '../../../shared/infrastructure/storageApi';

type Props = {
  onSendMessage?: (userId: string) => void;
};

function AuthorAvatar({ profile, size = 10 }: { profile: CommunityProfile | undefined; size?: number }) {
  const name = profile?.display_name || '?';
  const initials = name.substring(0, 2).toUpperCase();
  const sizeClass = `h-${size} w-${size}`;

  return (
    <div className={`${sizeClass} shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-600`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

export function BoardTab({ onSendMessage }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, CommunityProfile>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);

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

      // 작성자 프로필 일괄 조회
      const authorIds = [...new Set(data.map((p) => p.author_id))];
      if (authorIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('user_id, name, display_name, avatar_url, university, major, bio, skill_tags')
          .in('user_id', authorIds);

        if (profileRows) {
          const map = new Map<string, CommunityProfile>();
          profileRows.forEach((row: any) => {
            map.set(row.user_id, {
              user_id: row.user_id,
              display_name: row.display_name ?? row.name ?? null,
              avatar_url: row.avatar_url ?? null,
              university: row.university ?? null,
              major: row.major ?? null,
              bio: row.bio ?? null,
              skill_tags: Array.isArray(row.skill_tags) ? row.skill_tags : [],
            });
          });
          setProfileMap(map);
        }
      }
    } catch (err: any) {
      console.error('[BoardTab] 게시글 조회 오류:', err);
      showToast('게시글을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('로그인이 필요합니다.');
      const url = await uploadToStorage('post-images', file, authUser.id);
      setImageUrl(url);
    } catch (err: any) {
      showToast(err?.message ?? '이미지 업로드에 실패했습니다.', 'error');
    } finally {
      setImageUploading(false);
      if (imageFileRef.current) imageFileRef.current.value = '';
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setImageUrl(null);
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('제목과 내용을 입력해주세요.', 'error');
      return;
    }
    try {
      await createPost({ title: title.trim(), content: content.trim(), tags, image_url: imageUrl });
      setShowCreateModal(false);
      resetForm();
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
      await updatePost(editingPost.id, { title: title.trim(), content: content.trim(), tags, image_url: imageUrl });
      setEditingPost(null);
      resetForm();
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
      if (selectedPost?.id === postId) setSelectedPost(null);
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
  const visiblePosts = selectedTag ? posts.filter((p) => p.tags.includes(selectedTag)) : posts;

  const detailAuthor = selectedPost ? profileMap.get(selectedPost.author_id) : undefined;
  const detailAuthorName = detailAuthor?.display_name || '알 수 없음';
  const isMyPost = selectedPost?.author_id === user?.id;

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
                !selectedTag ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'
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
                  selectedTag === tag ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'
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
          {visiblePosts.map((post) => {
            const author = profileMap.get(post.author_id);
            const authorName = author?.display_name || '알 수 없음';
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedPost(post)}
                className="w-full rounded-2xl bg-white p-5 text-left transition hover:shadow-md active:bg-slate-50"
              >
                {/* 작성자 정보 */}
                <div className="mb-3 flex items-center gap-2.5">
                  <AuthorAvatar profile={author} size={8} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{authorName}</p>
                    {author?.university && (
                      <p className="text-xs text-slate-400">{author.university}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-xs text-slate-400">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                {/* 게시글 내용 */}
                <div className="flex gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900">{post.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {post.content}
                    </p>
                  </div>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  )}
                </div>
                {post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
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
              </button>
            );
          })}
        </div>
      )}

      {/* 게시글 상세 — 풀스크린 */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-bg-gray-light">
          <div className="min-h-full w-full max-w-2xl mx-auto space-y-3 pb-20">
            {/* 상단 네비 */}
            <div className="flex items-center justify-between py-2">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                목록으로
              </button>
              {isMyPost && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(selectedPost);
                      setTitle(selectedPost.title);
                      setContent(selectedPost.content);
                      setTags(selectedPost.tags);
                      setImageUrl(selectedPost.image_url);
                      setShowCreateModal(true);
                      setSelectedPost(null);
                    }}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedPost.id)}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-slate-100"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* 게시글 본문 카드 */}
            <div className="rounded-2xl bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">{selectedPost.title}</h2>

              {/* 작성자 */}
              <div className="mb-5 flex items-center gap-3">
                <AuthorAvatar profile={detailAuthor} size={10} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{detailAuthorName}</p>
                  {detailAuthor?.university && (
                    <p className="text-xs text-slate-500">
                      {detailAuthor.university}
                      {detailAuthor.major && ` · ${detailAuthor.major}`}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-xs text-slate-400">
                  {new Date(selectedPost.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                {selectedPost.image_url && (
                  <img
                    src={selectedPost.image_url}
                    alt=""
                    className="mb-5 w-full rounded-2xl object-cover max-h-80"
                  />
                )}
                <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">
                  {selectedPost.content}
                </p>
                {selectedPost.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 쪽지 보내기 카드 — 본인 글이 아닌 경우만 */}
            {!isMyPost && onSendMessage && (
              <div className="rounded-2xl bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <AuthorAvatar profile={detailAuthor} size={12} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{detailAuthorName}</p>
                    {detailAuthor?.bio && (
                      <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{detailAuthor.bio}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSendMessage(selectedPost.author_id);
                    setSelectedPost(null);
                  }}
                  className="w-full rounded-2xl bg-primary-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-primary-700"
                >
                  쪽지 보내기
                </button>
              </div>
            )}
          </div>
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
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                  placeholder="제목"
                  className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                <p className={`mt-1 text-right text-xs ${title.length >= 50 ? 'text-red-500' : 'text-slate-400'}`}>
                  {title.length} / 50
                </p>
              </div>
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 500))}
                  placeholder="내용"
                  rows={6}
                  className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                <p className={`mt-1 text-right text-xs ${content.length >= 500 ? 'text-red-500' : 'text-slate-400'}`}>
                  {content.length} / 500
                </p>
              </div>

              {/* 이미지 업로드 */}
              <div>
                {imageUrl ? (
                  <div className="relative">
                    <img src={imageUrl} alt="" className="w-full rounded-2xl object-cover max-h-60" />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageFileRef.current?.click()}
                    disabled={imageUploading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-4 text-sm text-slate-500 transition hover:border-slate-300 disabled:opacity-60"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {imageUploading ? '업로드 중...' : '사진 추가'}
                  </button>
                )}
                <input
                  ref={imageFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
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
                    resetForm();
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
