-- Remove Mock Data
-- 데이터베이스에서 mock 데이터 제거

-- 1. source_card_id가 없는 received_cards 삭제 (snapshot만 있는 mock 데이터)
DELETE FROM received_cards
WHERE source_card_id IS NULL;

-- 2. connections에서 가상 user_id가 있는 것들 삭제 (snapshot_로 시작하는 user_id)
-- 실제로는 connections의 target_user_id가 UUID 형식이므로 이 쿼리는 필요 없을 수 있음
-- 하지만 안전을 위해 확인
-- connections 테이블의 target_user_id는 UUID 형식이어야 하므로 직접 삭제할 필요는 없음

-- 3. profiles에서 display_name이 null이고 created_at이 최근인 것들 확인 (선택사항)
-- 실제 사용자도 display_name이 null일 수 있으므로 주의해서 사용

-- 주석: 
-- - source_card_id가 없는 received_cards는 mock 데이터로 간주하여 삭제
-- - connections는 target_user_id가 UUID 형식이므로 자동으로 필터링됨
-- - profiles는 실제 사용자 데이터이므로 삭제하지 않음

