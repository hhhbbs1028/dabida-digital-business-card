-- create_conversation_with_members 함수를 find-or-create 방식으로 수정
-- 문제: 기존 함수는 항상 새 대화방을 INSERT하여 같은 사람과 여러 번 채팅 시작 시
--       채팅방이 중복 생성되는 버그가 있음.
-- 원인: conversation_members에 SELECT RLS 정책이 없어 앱에서 기존 대화방을
--       조회할 수 없고, RPC만이 SECURITY DEFINER로 해당 테이블을 읽을 수 있음.
-- 해결: RPC 내부에서 기존 1:1 대화방을 먼저 찾고, 없을 때만 새로 생성.

CREATE OR REPLACE FUNCTION create_conversation_with_members(
  p_user_ids UUID[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_user_count INT;
BEGIN
  v_user_count := array_length(p_user_ids, 1);

  -- 1:1 DM (2명)인 경우: 기존 대화방 먼저 탐색
  IF v_user_count = 2 THEN
    SELECT cm1.conversation_id INTO v_conversation_id
    FROM conversation_members cm1
    JOIN conversation_members cm2
      ON cm1.conversation_id = cm2.conversation_id
    WHERE cm1.user_id = p_user_ids[1]
      AND cm2.user_id = p_user_ids[2]
      -- 멤버가 정확히 2명인 대화방만 (그룹 채팅 제외)
      AND (
        SELECT COUNT(*)
        FROM conversation_members cm3
        WHERE cm3.conversation_id = cm1.conversation_id
      ) = 2
    LIMIT 1;

    -- 기존 대화방이 있으면 그대로 반환
    IF v_conversation_id IS NOT NULL THEN
      RETURN v_conversation_id;
    END IF;
  END IF;

  -- 기존 대화방 없음 → 새로 생성
  INSERT INTO conversations (id, created_at, updated_at)
  VALUES (gen_random_uuid(), NOW(), NOW())
  RETURNING id INTO v_conversation_id;

  INSERT INTO conversation_members (conversation_id, user_id)
  SELECT v_conversation_id, unnest(p_user_ids)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_conversation_with_members(UUID[]) TO authenticated;
