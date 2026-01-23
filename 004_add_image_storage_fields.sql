-- Add image URL fields to cards table
-- 이미지 파일은 Supabase Storage에 저장하고, URL만 DB에 저장합니다.

ALTER TABLE cards
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS card_image_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN cards.logo_url IS 'AI로 생성한 로고 이미지의 Supabase Storage URL';
COMMENT ON COLUMN cards.card_image_url IS '최종 명함 이미지(스냅샷)의 Supabase Storage URL';

-- Create index for faster queries (optional, if you need to search by image URLs)
-- CREATE INDEX IF NOT EXISTS idx_cards_logo_url ON cards(logo_url) WHERE logo_url IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_cards_card_image_url ON cards(card_image_url) WHERE card_image_url IS NOT NULL;

