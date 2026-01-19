import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type {
  ReceivedCard,
  ReceivedCardInput,
  ReceivedCardUpdate,
  Folder,
  FolderInput,
} from '../types';

async function getCurrentUser(): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[contactsApi] 사용자 확인 오류:', error);
    throw error;
  }

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  return user;
}

function normalizeReceivedCard(row: any): ReceivedCard {
  return {
    id: row.id,
    owner_id: row.owner_id,
    source_card_id: row.source_card_id ?? null,
    snapshot: row.snapshot ?? {},
    tags: Array.isArray(row.tags) ? row.tags : [],
    folder_id: row.folder_id ?? null,
    memo: row.memo ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeFolder(row: any): Folder {
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    created_at: row.created_at,
  };
}

// Received Cards CRUD

export async function getReceivedCards(folderId?: string | null): Promise<ReceivedCard[]> {
  const user = await getCurrentUser();

  let query = supabase
    .from('received_cards')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (folderId === null) {
    // null인 경우: 폴더가 없는 명함만
    query = query.is('folder_id', null);
  } else if (folderId !== undefined) {
    // 특정 폴더
    query = query.eq('folder_id', folderId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[contactsApi] 받은 명함 조회 오류:', error);
    throw error;
  }

  return (data ?? []).map(normalizeReceivedCard);
}

export async function getReceivedCard(id: string): Promise<ReceivedCard | null> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('received_cards')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[contactsApi] 받은 명함 조회 오류:', error);
    throw error;
  }

  return data ? normalizeReceivedCard(data) : null;
}

export async function createReceivedCard(input: ReceivedCardInput): Promise<ReceivedCard> {
  const user = await getCurrentUser();

  const record = {
    owner_id: user.id,
    source_card_id: input.source_card_id ?? null,
    snapshot: input.snapshot ?? {},
    tags: input.tags ?? [],
    folder_id: input.folder_id ?? null,
    memo: input.memo ?? null,
  };

  const { data, error } = await supabase
    .from('received_cards')
    .insert(record)
    .select('*')
    .single();

  if (error) {
    console.error('[contactsApi] 받은 명함 생성 오류:', error);
    throw error;
  }

  return normalizeReceivedCard(data);
}

export async function updateReceivedCard(
  id: string,
  update: ReceivedCardUpdate,
): Promise<ReceivedCard> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('received_cards')
    .update({
      tags: update.tags !== undefined ? update.tags : undefined,
      folder_id: update.folder_id !== undefined ? update.folder_id : undefined,
      memo: update.memo !== undefined ? update.memo : undefined,
    })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('[contactsApi] 받은 명함 수정 오류:', error);
    throw error;
  }

  return normalizeReceivedCard(data);
}

export async function deleteReceivedCard(id: string): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from('received_cards')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) {
    console.error('[contactsApi] 받은 명함 삭제 오류:', error);
    throw error;
  }
}

// Folders CRUD

export async function getFolders(): Promise<Folder[]> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[contactsApi] 폴더 조회 오류:', error);
    throw error;
  }

  return (data ?? []).map(normalizeFolder);
}

export async function getFolder(id: string): Promise<Folder | null> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[contactsApi] 폴더 조회 오류:', error);
    throw error;
  }

  return data ? normalizeFolder(data) : null;
}

export async function createFolder(input: FolderInput): Promise<Folder> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('folders')
    .insert({
      owner_id: user.id,
      name: input.name,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[contactsApi] 폴더 생성 오류:', error);
    throw error;
  }

  return normalizeFolder(data);
}

export async function updateFolder(id: string, input: FolderInput): Promise<Folder> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('folders')
    .update({ name: input.name })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('[contactsApi] 폴더 수정 오류:', error);
    throw error;
  }

  return normalizeFolder(data);
}

export async function deleteFolder(id: string): Promise<void> {
  const user = await getCurrentUser();

  // 먼저 해당 폴더에 속한 received_cards의 folder_id를 null로 설정
  await supabase
    .from('received_cards')
    .update({ folder_id: null })
    .eq('folder_id', id)
    .eq('owner_id', user.id);

  // 그 다음 폴더 삭제
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) {
    console.error('[contactsApi] 폴더 삭제 오류:', error);
    throw error;
  }
}

