-- cards 테이블에 공개 여부 컬럼 추가
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

-- 공개 조회를 위한 RLS 정책 추가
CREATE POLICY IF NOT EXISTS "Public can view public cards"
  ON cards
  FOR SELECT
  USING (
    -- 소유자이거나 공개 카드인 경우 조회 허용
    auth.uid() = user_id OR is_public = TRUE
  );

-- received_cards 중복 방지를 위한 unique index
CREATE UNIQUE INDEX IF NOT EXISTS uniq_received_cards_owner_source
  ON received_cards(owner_id, source_card_id)
  WHERE source_card_id IS NOT NULL;


