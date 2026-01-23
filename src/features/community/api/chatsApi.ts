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

  // 내가 속한 대화방 조회
  const { data: members, error: membersError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (membersError) {
    console.error('[chatsApi] 대화방 멤버 조회 오류:', membersError);
    throw membersError;
  }

  if (!members || members.length === 0) {
    return [];
  }

  const conversationIds = members.map((m) => m.conversation_id);

  // 대화방 정보 조회
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (convError) {
    console.error('[chatsApi] 대화방 조회 오류:', convError);
    throw convError;
  }

  // 각 대화방의 멤버와 마지막 메시지 조회
  const result: ConversationWithMembers[] = [];

  for (const conv of conversations ?? []) {
    // 멤버 조회
    const { data: convMembers } = await supabase
      .from('conversation_members')
      .select('*')
      .eq('conversation_id', conv.id);

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
      members: (convMembers ?? []).map((m: any) => ({
        conversation_id: m.conversation_id,
        user_id: m.user_id,
        joined_at: m.joined_at,
      })),
      last_message: messages ? normalizeMessage(messages) : null,
    });
  }

  return result;
}

// 1:1 DM 생성 또는 조회
export async function createOrGetDm(targetUserId: string): Promise<ConversationWithMembers> {
  const user = await getCurrentUser();

  if (user.id === targetUserId) {
    throw new Error('자기 자신과는 대화할 수 없습니다.');
  }

  // 기존 대화방 찾기 (1:1이므로 멤버가 2명인 대화방)
  const { data: existingMembers } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (existingMembers && existingMembers.length > 0) {
    const conversationIds = existingMembers.map((m) => m.conversation_id);

    // 해당 대화방들 중 targetUserId가 멤버인 것 찾기
    const { data: targetMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', targetUserId)
      .in('conversation_id', conversationIds);

    if (targetMembers && targetMembers.length > 0) {
      // 기존 대화방 반환
      const existingConvId = targetMembers[0].conversation_id;

      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', existingConvId)
        .single();

      if (conv) {
        const { data: convMembers } = await supabase
          .from('conversation_members')
          .select('*')
          .eq('conversation_id', existingConvId);

        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', existingConvId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...normalizeConversation(conv),
          members: (convMembers ?? []).map((m: any) => ({
            conversation_id: m.conversation_id,
            user_id: m.user_id,
            joined_at: m.joined_at,
          })),
          last_message: lastMessage ? normalizeMessage(lastMessage) : null,
        };
      }
    }
  }

  // 새 대화방 생성
  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select('*')
    .single();

  if (convError) {
    console.error('[chatsApi] 대화방 생성 오류:', convError);
    throw convError;
  }

  // 멤버 추가
  const { error: membersError } = await supabase
    .from('conversation_members')
    .insert([
      { conversation_id: newConv.id, user_id: user.id },
      { conversation_id: newConv.id, user_id: targetUserId },
    ]);

  if (membersError) {
    console.error('[chatsApi] 멤버 추가 오류:', membersError);
    throw membersError;
  }

  return {
    ...normalizeConversation(newConv),
    members: [
      { conversation_id: newConv.id, user_id: user.id, joined_at: new Date().toISOString() },
      { conversation_id: newConv.id, user_id: targetUserId, joined_at: new Date().toISOString() },
    ],
    last_message: null,
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

