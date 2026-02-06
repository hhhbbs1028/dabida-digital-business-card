-- Community Sample Data
-- 커뮤니티 기능 테스트를 위한 샘플 데이터 생성 함수
-- 주의: RLS 정책 때문에 실제 사용자 계정이 필요합니다.

-- 샘플 프로필 데이터 생성 함수
-- 사용법: SELECT create_sample_community_profiles();
-- 주의: 실제 auth.users에 존재하는 user_id를 사용해야 합니다.
CREATE OR REPLACE FUNCTION create_sample_community_profiles()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '샘플 프로필 생성 완료: ';
  profile_count INTEGER := 0;
BEGIN
  -- 주의: 실제 사용자 ID로 교체해야 합니다.
  -- 예시: auth.users 테이블에서 user_id를 조회한 후 사용
  
  -- 현재 로그인한 사용자의 프로필 업데이트 (예시)
  -- UPDATE profiles 
  -- SET display_name = '테스트 사용자',
  --     university = '서울대학교',
  --     major = '컴퓨터공학과',
  --     bio = '안녕하세요! 개발과 네트워킹을 좋아합니다.',
  --     skill_tags = ARRAY['React', 'TypeScript', 'Node.js']
  -- WHERE user_id = auth.uid();
  
  result := result || '프로필은 실제 사용자 계정이 필요합니다.';
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 샘플 게시글 생성 함수 (현재 사용자용)
-- 사용법: SELECT create_sample_posts();
CREATE OR REPLACE FUNCTION create_sample_posts()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '샘플 게시글 생성 완료: ';
  post_count INTEGER := 0;
  current_user_id UUID;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN '오류: 로그인이 필요합니다.';
  END IF;
  
  -- 샘플 게시글 삽입
  INSERT INTO posts (author_id, title, content, tags)
  VALUES
    (
      current_user_id,
      '해커톤 팀원 모집합니다! 🚀',
      E'안녕하세요! 다음 달 해커톤에 참가할 팀원을 모집합니다.\n\n참가 조건:\n- 프론트엔드 또는 백엔드 개발 가능\n- 주말 시간 투자 가능\n- 열정적인 분 환영!\n\n관심 있으신 분은 댓글이나 DM 주세요!',
      ARRAY['해커톤', '모집', '개발']
    ),
    (
      current_user_id,
      'React 스터디 모임 만들까요?',
      E'React를 함께 공부하고 싶은 분들 모여요!\n\n- 주 1회 온라인 모임\n- 실전 프로젝트 중심\n- 코드 리뷰 및 피드백\n\n초보자도 환영합니다!',
      ARRAY['React', '스터디', '학습']
    ),
    (
      current_user_id,
      '포트폴리오 피드백 받고 싶어요',
      E'포트폴리오를 만들었는데 피드백을 받고 싶습니다.\n\n특히 UI/UX 부분에서 조언을 구하고 싶어요.\n시간 되시는 분들 도와주세요! 🙏',
      ARRAY['포트폴리오', '피드백', '디자인']
    )
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS post_count = ROW_COUNT;
  result := result || post_count || '개 게시글 생성됨';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 샘플 데이터 삭제 함수
-- 사용법: SELECT clear_sample_community_data();
CREATE OR REPLACE FUNCTION clear_sample_community_data()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '샘플 데이터 삭제 완료: ';
  deleted_connections INTEGER := 0;
  deleted_posts INTEGER := 0;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN '오류: 로그인이 필요합니다.';
  END IF;
  
  -- connections 삭제
  DELETE FROM connections WHERE owner_id = current_user_id;
  GET DIAGNOSTICS deleted_connections = ROW_COUNT;
  
  -- posts 삭제
  DELETE FROM posts WHERE author_id = current_user_id;
  GET DIAGNOSTICS deleted_posts = ROW_COUNT;
  
  result := result || 'connections ' || deleted_connections || '개, posts ' || deleted_posts || '개 삭제됨';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용 예시 및 주석
-- 
-- 1. 샘플 게시글 생성:
--    SELECT create_sample_posts();
--
-- 2. 샘플 데이터 삭제:
--    SELECT clear_sample_community_data();
--
-- 3. 프로필 업데이트 (직접 실행):
--    UPDATE profiles 
--    SET display_name = '내 이름',
--        university = '서울대학교',
--        major = '컴퓨터공학과',
--        bio = '자기소개를 입력하세요',
--        skill_tags = ARRAY['React', 'TypeScript']
--    WHERE user_id = auth.uid();
--
-- 4. connections는 received_cards에서 자동으로 동기화됩니다.
--    앱에서 "연결 동기화" 버튼을 클릭하거나,
--    syncConnectionsFromReceivedCards() API를 호출하세요.

