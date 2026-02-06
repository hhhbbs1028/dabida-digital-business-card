import { supabase } from '../../../shared/infrastructure/supabaseClient';
import { upsertMyProfile } from '../../profile/api/profileApi';
import { upsertMyProfile as upsertCommunityProfile } from '../api/profilesApi';
import { syncConnectionsFromReceivedCards } from '../api/connectionsApi';
import { createPost } from '../api/postsApi';
import type { ReceivedCard } from '../../contacts/types';

/**
 * 커뮤니티 기능 테스트를 위한 mock 데이터 생성
 * 1. 현재 사용자의 커뮤니티 프로필 업데이트
 * 2. 받은 명함 기반으로 connections 동기화
 * 3. 샘플 게시글 생성
 */
export async function generateCommunityMockData() {
  console.log('[CommunityMockData] 커뮤니티 테스트 데이터 생성 시작...');

  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 1. 현재 사용자의 커뮤니티 프로필 업데이트 (선택사항)
    // 주석 처리: 테스트 사용자 프로필을 자동으로 생성하지 않음
    // console.log('[CommunityMockData] 프로필 업데이트 중...');
    // await upsertCommunityProfile({
    //   display_name: '테스트 사용자',
    //   university: '서울대학교',
    //   major: '컴퓨터공학과',
    //   bio: '안녕하세요! 개발과 네트워킹을 좋아합니다. 함께 성장해요! 🚀',
    //   skill_tags: ['React', 'TypeScript', 'Node.js', '개발', '네트워킹'],
    // });

    // 2. 받은 명함 기반으로 connections 동기화
    console.log('[CommunityMockData] connections 동기화 중...');
    await syncConnectionsFromReceivedCards();

    // 3. 샘플 게시글 생성
    console.log('[CommunityMockData] 샘플 게시글 생성 중...');
    const samplePosts = [
      {
        title: '해커톤 팀원 모집합니다! 🚀',
        content: `안녕하세요! 다음 달 해커톤에 참가할 팀원을 모집합니다.

참가 조건:
- 프론트엔드 또는 백엔드 개발 가능
- 주말 시간 투자 가능
- 열정적인 분 환영!

관심 있으신 분은 댓글이나 DM 주세요!`,
        tags: ['해커톤', '모집', '개발'],
      },
      {
        title: 'React 스터디 모임 만들까요?',
        content: `React를 함께 공부하고 싶은 분들 모여요!

- 주 1회 온라인 모임
- 실전 프로젝트 중심
- 코드 리뷰 및 피드백

초보자도 환영합니다!`,
        tags: ['React', '스터디', '학습'],
      },
      {
        title: '포트폴리오 피드백 받고 싶어요',
        content: `포트폴리오를 만들었는데 피드백을 받고 싶습니다.

특히 UI/UX 부분에서 조언을 구하고 싶어요.
시간 되시는 분들 도와주세요! 🙏`,
        tags: ['포트폴리오', '피드백', '디자인'],
      },
    ];

    for (const post of samplePosts) {
      try {
        await createPost(post);
        console.log(`[CommunityMockData] 게시글 생성: ${post.title}`);
      } catch (err) {
        console.warn(`[CommunityMockData] 게시글 생성 실패 (무시):`, err);
      }
    }

    console.log('[CommunityMockData] 커뮤니티 테스트 데이터 생성 완료!');
    return { success: true };
  } catch (error) {
    console.error('[CommunityMockData] 테스트 데이터 생성 실패:', error);
    throw error;
  }
}

/**
 * 받은 명함 데이터를 기반으로 다른 사용자들의 프로필을 생성하는 헬퍼
 * 주의: 실제로는 다른 사용자 계정이 필요하지만, 테스트를 위해 가상의 프로필을 생성합니다.
 * 
 * 이 함수는 실제로는 작동하지 않습니다 (RLS 정책 때문에).
 * 대신 received_cards의 snapshot 데이터를 활용해 connections만 생성합니다.
 */
export async function generateMockProfilesFromReceivedCards() {
  console.log('[CommunityMockData] 받은 명함 기반 프로필 생성 시도...');
  
  // 실제로는 다른 사용자 계정이 필요하므로 이 함수는 사용하지 않습니다.
  // 대신 syncConnectionsFromReceivedCards()를 사용하세요.
  console.warn('[CommunityMockData] 이 함수는 실제로 작동하지 않습니다. syncConnectionsFromReceivedCards()를 사용하세요.');
}

/**
 * 모든 커뮤니티 mock 데이터 삭제
 */
export async function clearCommunityMockData() {
  console.log('[CommunityMockData] 커뮤니티 테스트 데이터 삭제 시작...');

  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('로그인이 필요합니다.');
    }

    // connections 삭제
    const { error: connError } = await supabase
      .from('connections')
      .delete()
      .eq('owner_id', user.data.user.id);

    if (connError) {
      console.warn('[CommunityMockData] connections 삭제 오류:', connError);
    } else {
      console.log('[CommunityMockData] connections 삭제 완료');
    }

    // 내가 작성한 게시글 삭제
    const { data: posts } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', user.data.user.id);

    if (posts && posts.length > 0) {
      for (const post of posts) {
        await supabase.from('posts').delete().eq('id', post.id);
      }
      console.log(`[CommunityMockData] 게시글 ${posts.length}개 삭제 완료`);
    }

    console.log('[CommunityMockData] 커뮤니티 테스트 데이터 삭제 완료!');
  } catch (error) {
    console.error('[CommunityMockData] 테스트 데이터 삭제 실패:', error);
    throw error;
  }
}

