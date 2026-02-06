-- Network Privacy Controls
-- 파도타기(2차 인맥) 기능을 위한 프라이버시 컨트롤 추가

-- 1. profiles에 network_visibility 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS network_visibility TEXT NOT NULL DEFAULT 'public';

-- network_visibility 값 제약 (CHECK 제약조건)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS check_network_visibility;

ALTER TABLE profiles
ADD CONSTRAINT check_network_visibility
CHECK (network_visibility IN ('public', 'friends_only', 'private'));

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_network_visibility 
ON profiles(network_visibility) 
WHERE network_visibility IS NOT NULL;

-- 2. connections에 is_public 추가
ALTER TABLE connections
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_connections_is_public 
ON connections(is_public) 
WHERE is_public = true;

-- 3. (선택) block 테이블 생성
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);

-- RLS for blocks
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own blocks"
  ON blocks
  FOR ALL
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- 4. connections RLS 정책 업데이트
-- 기존 정책은 owner_id만 접근 가능하므로 유지
-- 새로운 정책: 공개 connections 읽기 허용 (제한적)

-- 기존 정책 유지 (owner_id는 자신의 connections 모두 접근 가능)
-- "Users can manage their own connections" 정책은 그대로 유지

-- 공개 connections 읽기 정책 추가
-- 조건:
-- 1. connections.is_public = true
-- 2. target_user의 network_visibility != 'private'
-- 3. block 관계가 없음
CREATE POLICY "Users can view public connections"
  ON connections
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_public = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = connections.target_user_id
      AND profiles.network_visibility != 'private'
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (
        (blocks.blocker_id = auth.uid() AND blocks.blocked_id = connections.target_user_id)
        OR (blocks.blocker_id = connections.target_user_id AND blocks.blocked_id = auth.uid())
      )
    )
  );

-- friends_only 처리: mutual connections 또는 1차 인맥만 허용
-- 이 정책은 추가로 mutual connection 체크를 API 레벨에서 처리하는 것이 더 안전함
-- RLS에서는 기본적인 공개/비공개만 체크

-- 5. 함수: mutual connection 체크 (API에서 사용)
CREATE OR REPLACE FUNCTION check_mutual_connection(
  user1_id UUID,
  user2_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM connections c1
    JOIN connections c2 ON c1.target_user_id = c2.target_user_id
    WHERE c1.owner_id = user1_id
    AND c2.owner_id = user2_id
    AND c1.is_public = true
    AND c2.is_public = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 함수: 1차 인맥 체크 (API에서 사용)
CREATE OR REPLACE FUNCTION is_first_degree(
  viewer_id UUID,
  target_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM connections
    WHERE owner_id = viewer_id
    AND target_user_id = target_id
    AND is_public = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 뷰: 공개 프로필만 조회 (선택사항, 성능 최적화용)
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  user_id,
  display_name,
  university,
  major,
  bio,
  avatar_url,
  skill_tags,
  network_visibility,
  created_at,
  updated_at
FROM profiles
WHERE network_visibility != 'private';

-- 뷰에 대한 RLS는 필요 없음 (기본 profiles 테이블의 RLS 정책을 따름)

-- 주석: 이 마이그레이션은 기존 connections 정책을 확장합니다.
-- owner_id는 여전히 자신의 모든 connections에 접근 가능하며,
-- 다른 사용자들은 공개된 connections만 볼 수 있습니다.

