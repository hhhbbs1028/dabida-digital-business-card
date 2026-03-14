import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type {
  Conversation,
  ConversationMember,
  Message,
  ConversationWithMembers,
} from '../types';

async function getCurrentUser(): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[chatsApi] 사용자 확인 오류:', error);
    throw error;
  }

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  return user;
}

function normalizeConversation(row: any): Conversation {
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeMessage(row: any): Message {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    content: row.content,
    created_at: row.created_at,
  };
}

// 대화방 목록 조회
export async function listConversations(): Promise<ConversationWithMembers[]> {
  const user = await getCurrentUser();

  console.log('[chatsApi] 대화방 목록 조회 시작:', { userId: user.id });

  // 내가 속한 대화방 조회 (conversation_members에서 자신의 user_id로 조회)
  // SELECT 정책이 있어야 조회 가능
  const { data: members, error: membersError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (membersError) {
    console.error('[chatsApi] 대화방 멤버 조회 오류:', membersError);
    console.error('[chatsApi] 에러 상세:', {
      message: membersError.message,
      code: membersError.code,
      details: membersError.details,
      hint: membersError.hint
    });
    throw membersError;
  }

  if (!members || members.length === 0) {
    console.log('[chatsApi] 대화방이 없습니다.');
    return [];
  }

  // 중복 제거: 같은 conversation_id가 여러 번 나올 수 있으므로 Set 사용
  const uniqueConversationIds = Array.from(new Set(members.map((m) => m.conversation_id)));
  console.log('[chatsApi] 찾은 대화방 ID들 (중복 제거 전):', members.map((m) => m.conversation_id));
  console.log('[chatsApi] 찾은 대화방 ID들 (중복 제거 후):', uniqueConversationIds);

  if (uniqueConversationIds.length === 0) {
    console.log('[chatsApi] 대화방이 없습니다.');
    return [];
  }

  // 대화방 정보 조회
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .in('id', uniqueConversationIds)
    .order('updated_at', { ascending: false });

  if (convError) {
    console.error('[chatsApi] 대화방 조회 오류:', convError);
    throw convError;
  }

  // 각 대화방의 멤버와 마지막 메시지 조회
  const result: ConversationWithMembers[] = [];
  const processedIds = new Set<string>(); // 중복 방지용

  for (const conv of conversations ?? []) {
    // 이미 처리한 대화방은 건너뛰기
    if (processedIds.has(conv.id)) {
      console.warn('[chatsApi] 중복된 대화방 발견, 건너뛰기:', conv.id);
      continue;
    }
    processedIds.add(conv.id);
    // 멤버 조회 (RPC 함수 사용)
    const { data: convMembersData } = await supabase.rpc('get_conversation_members', {
      p_conversation_id: conv.id,
    });
    
    // RPC 함수가 없으면 직접 조회 시도
    let convMembers: any[] = [];
    if (!convMembersData) {
      const { data: directMembers } = await supabase
        .from('conversation_members')
        .select('*')
        .eq('conversation_id', conv.id);
      convMembers = directMembers ?? [];
    } else {
      convMembers = convMembersData;
    }

    // 마지막 메시지 조회
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    result.push({
      ...normalizeConversation(conv),
      members: convMembers.map((m: any) => ({
        conversation_id: m.conversation_id,
        user_id: m.user_id,
        joined_at: m.joined_at,
      })),
      last_message: messages ? normalizeMessage(messages) : null,
    });
  }

  console.log('[chatsApi] 대화방 목록 조회 완료:', {
    count: result.length,
    conversations: result.map((c) => ({
      id: c.id,
      memberCount: c.members.length,
      memberIds: c.members.map((m) => m.user_id),
    })),
  });

  return result;
}

// UUID 형식 검증 함수
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// 1:1 DM 조회 또는 생성 (find-or-create)
// RPC `create_conversation_with_members`가 기존 1:1 대화방을 먼저 탐색하고
// 없을 때만 새로 생성하므로, 앱에서는 RPC만 호출하면 됩니다.
// (conversation_members에 SELECT RLS 정책이 없어 앱에서 직접 조회 불가)
export async function createOrGetDm(targetUserId: string): Promise<ConversationWithMembers> {
  if (!isValidUUID(targetUserId)) {
    throw new Error(`유효하지 않은 사용자 ID입니다. (받은 ID: ${targetUserId})`);
  }

  const user = await getCurrentUser();

  if (user.id === targetUserId) {
    throw new Error('자기 자신과는 대화할 수 없습니다.');
  }

  // RPC: 기존 1:1 대화방 반환 or 신규 생성 (SECURITY DEFINER로 RLS 우회)
  const { data: conversationId, error: rpcError } = await supabase.rpc(
    'create_conversation_with_members',
    { p_user_ids: [user.id, targetUserId] },
  );

  if (rpcError) {
    throw new Error(`대화방 생성 실패: ${rpcError.message}`);
  }

  if (!conversationId) {
    throw new Error('대화방 ID를 받지 못했습니다.');
  }

  const { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (!conv) {
    throw new Error('대화방을 찾을 수 없습니다.');
  }

  const { data: convMembersData } = await supabase.rpc('get_conversation_members', {
    p_conversation_id: conversationId,
  });

  const convMembers: any[] = convMembersData ?? [];

  const { data: lastMessage } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    ...normalizeConversation(conv),
    members: convMembers.map((m: any) => ({
      conversation_id: m.conversation_id,
      user_id: m.user_id,
      joined_at: m.joined_at,
    })),
    last_message: lastMessage ? normalizeMessage(lastMessage) : null,
  };
}

// 메시지 목록 조회
export async function listMessages(conversationId: string): Promise<Message[]> {
  const user = await getCurrentUser();

  // 대화방 멤버 확인
  const { data: member } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!member) {
    throw new Error('대화방에 접근할 수 없습니다.');
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[chatsApi] 메시지 목록 조회 오류:', error);
    throw error;
  }

  return (data ?? []).map(normalizeMessage);
}

// 메시지 전송
export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const user = await getCurrentUser();

  // 대화방 멤버 확인
  const { data: member } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!member) {
    throw new Error('대화방에 접근할 수 없습니다.');
  }

  const record = {
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(record)
    .select('*')
    .single();

  if (error) {
    console.error('[chatsApi] 메시지 전송 오류:', error);
    throw error;
  }

  return normalizeMessage(data);
}

