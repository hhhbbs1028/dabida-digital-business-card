-- Fix conversation_members RLS policy to allow adding other users when creating a conversation
-- 대화방 생성 시 상대방도 추가할 수 있도록 RLS 정책 수정

-- 0. conversations 테이블에 INSERT 정책 추가 (누락된 정책)
-- 모든 인증된 사용자가 대화방을 생성할 수 있도록 함
-- 기존 정책이 있을 수 있으므로 먼저 삭제
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 1. 기존 정책 모두 삭제 (무한 재귀를 일으킬 수 있는 정책 제거)
DROP POLICY IF EXISTS "Users can view conversation members of their conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can add members to conversations they created" ON conversation_members;

-- conversations 테이블의 SELECT 정책도 수정 필요 (순환 참조 방지)
-- 하지만 이 파일에서는 conversation_members만 수정하고,
-- conversations 정책은 별도로 수정하거나 그대로 둠
-- (conversations 정책이 conversation_members를 조회하지만, 
--  conversation_members 정책이 conversations만 조회하므로 순환은 발생하지 않음)

-- 2. SECURITY DEFINER 함수: 대화방 생성 및 멤버 추가 (RLS 우회)
-- 이 함수는 RLS를 우회하여 대화방을 생성하고 두 명을 모두 추가할 수 있게 합니다
CREATE OR REPLACE FUNCTION create_conversation_with_members(
  p_user_ids UUID[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- RLS를 우회하여 대화방 생성
  INSERT INTO conversations (id, created_at, updated_at)
  VALUES (gen_random_uuid(), NOW(), NOW())
  RETURNING id INTO v_conversation_id;
  
  -- RLS를 우회하여 멤버 추가
  INSERT INTO conversation_members (conversation_id, user_id)
  SELECT v_conversation_id, unnest(p_user_ids)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN v_conversation_id;
END;
$$;

-- 기존 함수도 유지 (하위 호환성)
CREATE OR REPLACE FUNCTION add_conversation_members(
  p_conversation_id UUID,
  p_user_ids UUID[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RLS를 우회하여 멤버 추가
  INSERT INTO conversation_members (conversation_id, user_id)
  SELECT p_conversation_id, unnest(p_user_ids)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
END;
$$;

-- 3. 함수에 대한 실행 권한 부여
GRANT EXECUTE ON FUNCTION create_conversation_with_members(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION add_conversation_members(UUID, UUID[]) TO authenticated;

-- 4. SELECT 정책: 완전히 제거 (무한 재귀 방지)
-- conversation_members의 SELECT 정책은 무한 재귀를 일으킬 수 있으므로 제거합니다.
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can view conversation members of their conversations" ON conversation_members;

-- 대화방 멤버 조회용 SECURITY DEFINER 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION get_conversation_members(
  p_conversation_id UUID
) RETURNS TABLE (
  conversation_id UUID,
  user_id UUID,
  joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RLS를 우회하여 멤버 조회
  RETURN QUERY
  SELECT 
    cm.conversation_id,
    cm.user_id,
    cm.joined_at
  FROM conversation_members cm
  WHERE cm.conversation_id = p_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_conversation_members(UUID) TO authenticated;

-- 5. SELECT 정책: 자신이 멤버인 대화방의 멤버만 조회 가능 (무한 재귀 없이)
-- 자신의 user_id로 필터링하는 것만 허용 (무한 재귀 없음)
CREATE POLICY "Users can view their own conversation memberships"
  ON conversation_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- 6. INSERT 정책: 자신만 추가 가능 (직접 INSERT 시, RPC 함수는 이 정책을 우회함)
CREATE POLICY "Users can add themselves to conversations"
  ON conversation_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

