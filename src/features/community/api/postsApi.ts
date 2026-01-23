import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Post, PostInput, PostUpdate, GetPostsParams } from '../types';

async function getCurrentUser(): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[postsApi] 사용자 확인 오류:', error);
    throw error;
  }

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  return user;
}

function normalizePost(row: any): Post {
  return {
    id: row.id,
    author_id: row.author_id,
    title: row.title,
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// 게시글 목록 조회
export async function listPosts(params: GetPostsParams = {}): Promise<Post[]> {
  await getCurrentUser(); // 로그인 체크만

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  // 태그 필터
  if (params.tag) {
    query = query.contains('tags', [params.tag]);
  }

  // 검색어 (title, content)
  if (params.q?.trim()) {
    const searchTerm = `%${params.q.trim()}%`;
    query = query.or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[postsApi] 게시글 목록 조회 오류:', error);
    throw error;
  }

  return (data ?? []).map(normalizePost);
}

// 게시글 생성
export async function createPost(input: PostInput): Promise<Post> {
  const user = await getCurrentUser();

  const record = {
    author_id: user.id,
    title: input.title,
    content: input.content,
    tags: input.tags ?? [],
  };

  const { data, error } = await supabase
    .from('posts')
    .insert(record)
    .select('*')
    .single();

  if (error) {
    console.error('[postsApi] 게시글 생성 오류:', error);
    throw error;
  }

  return normalizePost(data);
}

// 게시글 수정
export async function updatePost(id: string, update: PostUpdate): Promise<Post> {
  const user = await getCurrentUser();

  const updateData: any = {};
  if (update.title !== undefined) updateData.title = update.title;
  if (update.content !== undefined) updateData.content = update.content;
  if (update.tags !== undefined) updateData.tags = update.tags;

  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .eq('author_id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('[postsApi] 게시글 수정 오류:', error);
    throw error;
  }

  return normalizePost(data);
}

// 게시글 삭제
export async function deletePost(id: string): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('author_id', user.id);

  if (error) {
    console.error('[postsApi] 게시글 삭제 오류:', error);
    throw error;
  }
}

