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

  // 자기 자신의 명함인지 확인
  if (input.source_card_id) {
    const { data: sourceCard, error: cardCheckError } = await supabase
      .from('cards')
      .select('user_id')
      .eq('id', input.source_card_id)
      .maybeSingle();

    if (cardCheckError && cardCheckError.code !== 'PGRST116') {
      console.error('[contactsApi] 명함 확인 오류:', cardCheckError);
      throw cardCheckError;
    }

    if (sourceCard && sourceCard.user_id === user.id) {
      const err = new Error('자기 자신의 명함은 추가할 수 없습니다.');
      (err as any).code = 'SELF_CARD_NOT_ALLOWED';
      throw err;
    }
  }

  // 자동 분류 로직 (폴더가 지정되지 않은 경우에만)
  let folderId = input.folder_id ?? null;
  if (!folderId) {
    const { suggestFolderName } = await import('../utils/autoCategorize');
    const suggestedFolderName = suggestFolderName(input.snapshot);
    
    if (suggestedFolderName) {
      // 기존 폴더 찾기
      const { data: existingFolders } = await supabase
        .from('folders')
        .select('id, name')
        .eq('owner_id', user.id)
        .ilike('name', suggestedFolderName);
      
      if (existingFolders && existingFolders.length > 0) {
        // 기존 폴더 사용
        folderId = (existingFolders[0] as any).id;
      } else {
        // 새 폴더 생성
        const { data: newFolder, error: folderError } = await supabase
          .from('folders')
          .insert({
            owner_id: user.id,
            name: suggestedFolderName,
          } as any)
          .select('*')
          .single();
        
        if (!folderError && newFolder) {
          folderId = (newFolder as any).id;
        }
      }
    }
  }

  // 자동 태그 추가 (기존 태그와 병합)
  let tags = input.tags ?? [];
  const { suggestTags } = await import('../utils/autoCategorize');
  const suggestedTags = suggestTags(input.snapshot);
  const mergedTags = [...new Set([...tags, ...suggestedTags])]; // 중복 제거

  const record = {
    owner_id: user.id,
    source_card_id: input.source_card_id ?? null,
    snapshot: input.snapshot ?? {},
    tags: mergedTags,
    folder_id: folderId,
    memo: input.memo ?? null,
  };

  const { data, error } = await supabase
    .from('received_cards')
    .insert(record as any)
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

  const updateData: any = {};
  if (update.tags !== undefined) updateData.tags = update.tags;
  if (update.folder_id !== undefined) updateData.folder_id = update.folder_id;
  if (update.memo !== undefined) updateData.memo = update.memo;

  const { data, error } = await supabase
    .from('received_cards')
    .update(updateData as any)
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
    } as any)
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
    .update({ name: input.name } as any)
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
    .update({ folder_id: null } as any)
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

