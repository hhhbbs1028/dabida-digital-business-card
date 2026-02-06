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

// 1:1 DM 생성 또는 조회
export async function createOrGetDm(targetUserId: string): Promise<ConversationWithMembers> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/38073a1c-5724-42d5-8104-b1a59577e942',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatsApi.ts:113',message:'createOrGetDm 시작',data:{targetUserId,isValidUUID:isValidUUID(targetUserId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // UUID 형식 검증
  if (!isValidUUID(targetUserId)) {
    const errorMsg = `유효하지 않은 사용자 ID입니다. Mock 데이터의 user_id는 실제 사용자와 채팅할 수 없습니다. (받은 ID: ${targetUserId})`;
    console.error('[chatsApi] UUID 검증 실패:', { targetUserId, errorMsg });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/38073a1c-5724-42d5-8104-b1a59577e942',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatsApi.ts:120',message:'UUID 검증 실패',data:{targetUserId,errorMsg},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error(errorMsg);
  }
  
  const user = await getCurrentUser();
  console.log('[chatsApi] 현재 사용자:', { userId: user.id, targetUserId });

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
        // conversation_members 조회는 RPC 함수 사용
        const { data: convMembersData } = await supabase.rpc('get_conversation_members', {
          p_conversation_id: existingConvId,
        });
        
        // RPC 함수가 없으면 직접 조회 시도
        let convMembers: any[] = [];
        if (!convMembersData) {
          const { data: directMembers } = await supabase
            .from('conversation_members')
            .select('*')
            .eq('conversation_id', existingConvId);
          convMembers = directMembers ?? [];
        } else {
          convMembers = convMembersData;
        }

        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', existingConvId)
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
    }
  }

  // 새 대화방 생성 (SECURITY DEFINER 함수만 사용 - RLS 우회)
  console.log('[chatsApi] 새 대화방 생성 시작:', { 
    currentUserId: user.id, 
    targetUserId,
    userIds: [user.id, targetUserId],
    allValidUUIDs: [user.id, targetUserId].every(id => isValidUUID(id))
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/38073a1c-5724-42d5-8104-b1a59577e942',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatsApi.ts:174',message:'대화방 생성 시작 (RPC 함수 사용)',data:{targetUserId,userIds:[user.id,targetUserId],allValidUUIDs:[user.id,targetUserId].every(id=>isValidUUID(id))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // RPC 함수로 대화방 생성 및 멤버 추가 (RLS 우회)
  // 직접 INSERT는 시도하지 않음 - RLS 정책 때문에 실패함
  console.log('[chatsApi] RPC 함수 호출 전:', { 
    functionName: 'create_conversation_with_members',
    params: { p_user_ids: [user.id, targetUserId] }
  });
  
  const { data: conversationId, error: rpcError } = await supabase.rpc('create_conversation_with_members', {
    p_user_ids: [user.id, targetUserId],
  });

  console.log('[chatsApi] RPC 함수 호출 후:', { 
    conversationId, 
    error: rpcError ? {
      message: rpcError.message,
      code: rpcError.code,
      details: rpcError.details,
      hint: rpcError.hint
    } : null
  });

  if (rpcError) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/38073a1c-5724-42d5-8104-b1a59577e942',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatsApi.ts:180',message:'RPC 함수 실패',data:{error:rpcError.message,code:rpcError.code,details:rpcError.details,hint:rpcError.hint,fullError:JSON.stringify(rpcError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.error('[chatsApi] 대화방 생성 RPC 함수 오류:', {
      error: rpcError,
      targetUserId,
      currentUserId: user.id,
      userIds: [user.id, targetUserId]
    });
    throw new Error(`대화방 생성 실패: ${rpcError.message}. 데이터베이스 함수가 올바르게 설정되었는지 확인하세요.`);
  }

  if (!conversationId) {
    console.error('[chatsApi] 대화방 ID가 null입니다:', { conversationId, rpcError });
    throw new Error('대화방 ID를 받지 못했습니다.');
  }
  
  console.log('[chatsApi] 대화방 생성 성공:', { conversationId });

  // RPC 함수 성공 - 대화방 정보 조회
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/38073a1c-5724-42d5-8104-b1a59577e942',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatsApi.ts:220',message:'RPC 함수 성공, 대화방 정보 조회',data:{conversationId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (!conv) {
    throw new Error('대화방을 찾을 수 없습니다.');
  }

  // conversation_members 조회는 RPC 함수 사용 (SELECT 정책이 없으므로)
  const { data: convMembersData, error: membersError } = await supabase.rpc('get_conversation_members', {
    p_conversation_id: conversationId,
  });

  // RPC 함수가 없으면 직접 조회 시도 (실패할 수 있음)
  let convMembers: any[] = [];
  if (membersError) {
    console.warn('[chatsApi] get_conversation_members 함수 실패, 직접 조회 시도:', membersError);
    const { data: directMembers } = await supabase
      .from('conversation_members')
      .select('*')
      .eq('conversation_id', conversationId);
    convMembers = directMembers ?? [];
  } else {
    convMembers = convMembersData ?? [];
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/38073a1c-5724-42d5-8104-b1a59577e942',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatsApi.ts:237',message:'대화방 생성 완료',data:{conversationId:conv.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  return {
    ...normalizeConversation(conv),
    members: (convMembers ?? []).map((m: any) => ({
      conversation_id: m.conversation_id,
      user_id: m.user_id,
      joined_at: m.joined_at,
    })),
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

