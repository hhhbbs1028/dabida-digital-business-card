-- Bidirectional Card Exchange
-- 명함 교환 시 양방향으로 자동 저장

-- 양방향 명함 교환 함수
-- B가 A의 명함을 받을 때, A의 received_cards에도 B의 명함을 자동으로 저장
CREATE OR REPLACE FUNCTION exchange_cards_bidirectional(
  p_receiver_id UUID,  -- 명함을 받는 사람 (B)
  p_sender_card_id UUID,  -- 보낸 사람의 명함 ID (A의 명함)
  p_receiver_card_id UUID,  -- 받는 사람의 명함 ID (B의 명함)
  p_sender_snapshot JSONB,  -- A의 명함 스냅샷
  p_receiver_snapshot JSONB  -- B의 명함 스냅샷
) RETURNS TABLE (
  receiver_card_id UUID,
  sender_card_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_user_id UUID;
  v_receiver_received_card_id UUID;
  v_sender_received_card_id UUID;
BEGIN
  -- 1. A의 명함에서 user_id 조회
  SELECT user_id INTO v_sender_user_id
  FROM cards
  WHERE id = p_sender_card_id;

  IF v_sender_user_id IS NULL THEN
    RAISE EXCEPTION '보낸 사람의 명함을 찾을 수 없습니다.';
  END IF;

  -- 자기 자신과 교환하는 경우는 무시
  IF v_sender_user_id = p_receiver_id THEN
    RETURN;
  END IF;

  -- 2. B의 received_cards에 A의 명함 저장 (이미 저장되었을 수 있음)
  -- 먼저 존재 여부 확인
  SELECT id INTO v_receiver_received_card_id
  FROM received_cards
  WHERE owner_id = p_receiver_id
    AND source_card_id = p_sender_card_id;

  IF v_receiver_received_card_id IS NULL THEN
    INSERT INTO received_cards (
      owner_id,
      source_card_id,
      snapshot,
      tags,
      folder_id,
      memo
    )
    VALUES (
      p_receiver_id,
      p_sender_card_id,
      p_sender_snapshot,
      ARRAY[]::TEXT[],
      NULL,
      NULL
    )
    RETURNING id INTO v_receiver_received_card_id;
  END IF;

  -- 3. A의 received_cards에 B의 명함 저장 (양방향 교환)
  -- 먼저 존재 여부 확인
  SELECT id INTO v_sender_received_card_id
  FROM received_cards
  WHERE owner_id = v_sender_user_id
    AND source_card_id = p_receiver_card_id;

  IF v_sender_received_card_id IS NULL THEN
    INSERT INTO received_cards (
      owner_id,
      source_card_id,
      snapshot,
      tags,
      folder_id,
      memo
    )
    VALUES (
      v_sender_user_id,
      p_receiver_card_id,
      p_receiver_snapshot,
      ARRAY[]::TEXT[],
      NULL,
      NULL
    )
    RETURNING id INTO v_sender_received_card_id;
  END IF;

  -- 결과 반환
  RETURN QUERY
  SELECT 
    v_receiver_received_card_id,
    v_sender_received_card_id;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION exchange_cards_bidirectional(UUID, UUID, UUID, JSONB, JSONB) TO authenticated;

-- 주석: 이 함수는 RLS를 우회하여 양방향 명함 교환을 처리합니다.
-- B가 A의 명함을 받을 때, A의 received_cards에도 B의 명함이 자동으로 저장됩니다.

