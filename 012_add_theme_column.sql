-- 012_add_theme_column.sql
-- cards 테이블에 고급 테마 엔진(CardTheme) 저장용 컬럼 추가
-- 기존 style 컬럼은 하위 호환을 위해 유지

ALTER TABLE cards ADD COLUMN IF NOT EXISTS theme JSONB;

COMMENT ON COLUMN cards.theme IS 'CardTheme JSON (presetId, paletteId, fontSetId, layoutId, style 토큰). NULL이면 legacy style 컬럼으로 렌더링.';
