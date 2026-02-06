-- Get Public Connections Function
-- 2차 인맥 조회를 위한 SECURITY DEFINER 함수
-- RLS 정책을 우회하여 공개 connections를 안전하게 조회

-- 1차 인맥들의 공개 connections 조회 함수
CREATE OR REPLACE FUNCTION get_public_connections(
  p_owner_ids UUID[]
) RETURNS TABLE (
  owner_id UUID,
  target_user_id UUID,
  is_public BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RLS를 우회하여 공개 connections 조회
  -- target_user의 network_visibility가 'private'가 아닌 경우만 반환
  RETURN QUERY
  SELECT
    c.owner_id,
    c.target_user_id,
    c.is_public
  FROM connections c
  WHERE c.owner_id = ANY(p_owner_ids)
    AND c.is_public = true
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = c.target_user_id
        AND p.network_visibility != 'private'
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (
        (b.blocker_id = auth.uid() AND b.blocked_id = c.target_user_id)
        OR (b.blocker_id = c.target_user_id AND b.blocked_id = auth.uid())
      )
    );
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_public_connections(UUID[]) TO authenticated;

-- 주석: 이 함수는 RLS를 우회하여 공개 connections를 조회합니다.
-- 프라이버시 체크는 함수 내부에서 수행되므로 안전합니다.

