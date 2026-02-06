import { createReceivedCard, createFolder, type ReceivedCardInput } from '../api/contactsApi';
import { generateCommunityMockData } from '../../community/utils/mockData';

/**
 * 테스트용 mock 데이터 생성 함수
 * 받은 명함과 폴더를 생성합니다.
 */
export async function generateMockData() {
  console.log('[MockData] 테스트 데이터 생성 시작...');

  try {
    // 1. 폴더 생성
    const folder1 = await createFolder({ name: '동아리' });
    const folder2 = await createFolder({ name: '학과' });
    const folder3 = await createFolder({ name: '인턴십' });
    console.log('[MockData] 폴더 생성 완료:', [folder1.name, folder2.name, folder3.name]);

    // 2. 받은 명함 생성 (다양한 시나리오)
    const mockCards: ReceivedCardInput[] = [
      // 폴더: 동아리
      {
        snapshot: {
          display_name: '김민수',
          headline: '프론트엔드 개발자',
          organization: '멋쟁이사자처럼',
          email: 'minsu.kim@example.com',
          phone: '010-1234-5678',
          links: {
            github: 'https://github.com/minsu',
            instagram: 'https://instagram.com/minsu_dev',
          },
        },
        tags: ['동아리', '개발', '프론트엔드'],
        folder_id: folder1.id,
        memo: '해커톤에서 만난 분. React 전문가입니다.',
      },
      {
        snapshot: {
          display_name: '이지은',
          headline: 'UI/UX 디자이너',
          organization: '멋쟁이사자처럼',
          email: 'jieun.lee@example.com',
          phone: '010-2345-6789',
          links: {
            instagram: 'https://instagram.com/jieun_design',
            website: 'https://jieun.design',
          },
        },
        tags: ['동아리', '디자인'],
        folder_id: folder1.id,
        memo: '디자인 시스템에 관심이 많으신 분.',
      },
      // 폴더: 학과
      {
        snapshot: {
          display_name: '박준호',
          headline: '컴퓨터공학과 3학년',
          organization: '서울대학교',
          email: 'junho.park@student.snu.ac.kr',
          phone: '010-3456-7890',
          links: {
            github: 'https://github.com/junho',
          },
        },
        tags: ['학과', '백엔드'],
        folder_id: folder2.id,
        memo: '같은 수업 듣는 친구. 알고리즘 스터디 함께 함.',
      },
      {
        snapshot: {
          display_name: '최수진',
          headline: '컴퓨터공학과 4학년',
          organization: '서울대학교',
          email: 'sujin.choi@student.snu.ac.kr',
          phone: '010-4567-8901',
        },
        tags: ['학과', 'AI', '연구'],
        folder_id: folder2.id,
        memo: '졸업 프로젝트 팀원. 머신러닝 전공.',
      },
      // 폴더: 인턴십
      {
        snapshot: {
          display_name: '정현우',
          headline: '시니어 개발자',
          organization: '네이버',
          email: 'hyunwoo.jung@navercorp.com',
          phone: '010-5678-9012',
          links: {
            github: 'https://github.com/hyunwoo',
            website: 'https://hyunwoo.dev',
          },
        },
        tags: ['인턴십', '멘토', '백엔드'],
        folder_id: folder3.id,
        memo: '인턴십 멘토. 많은 도움을 주셨습니다.',
      },
      {
        snapshot: {
          display_name: '한소영',
          headline: '프로덕트 매니저',
          organization: '카카오',
          email: 'soyoung.han@kakaocorp.com',
          phone: '010-6789-0123',
          links: {
            website: 'https://soyoung.pm',
          },
        },
        tags: ['인턴십', 'PM'],
        folder_id: folder3.id,
        memo: 'PM 인턴십 담당자. 제품 기획에 대해 배웠습니다.',
      },
      // 폴더 없음
      {
        snapshot: {
          display_name: '강태영',
          headline: '풀스택 개발자',
          organization: '스타트업 A',
          email: 'taeyoung.kang@startup.com',
          phone: '010-7890-1234',
          links: {
            github: 'https://github.com/taeyoung',
            instagram: 'https://instagram.com/taeyoung_dev',
            website: 'https://taeyoung.dev',
          },
        },
        tags: ['네트워킹', '풀스택'],
        folder_id: null,
        memo: '컨퍼런스에서 만난 분.',
      },
      {
        snapshot: {
          display_name: '윤서연',
          headline: '데이터 사이언티스트',
          organization: '대기업 B',
          email: 'seoyeon.yoon@corp.com',
          phone: '010-8901-2345',
          links: {
            github: 'https://github.com/seoyeon',
          },
        },
        tags: ['데이터', '파이썬'],
        folder_id: null,
      },
      // 메모만 있는 명함
      {
        snapshot: {
          display_name: '오현서',
          headline: '백엔드 개발자',
          organization: '스타트업 C',
          email: 'hyunseo.oh@startup.com',
          phone: '010-9012-3456',
        },
        tags: [],
        folder_id: null,
        memo: '다음 주 커피챗 예정. 기술 스택에 대해 논의할 예정입니다.',
      },
      // 태그만 많은 명함
      {
        snapshot: {
          display_name: '임동현',
          headline: 'DevOps 엔지니어',
          organization: '클라우드 회사',
          email: 'donghyun.lim@cloud.com',
          phone: '010-0123-4567',
          links: {
            github: 'https://github.com/donghyun',
            website: 'https://donghyun.devops',
          },
        },
        tags: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', '인프라'],
        folder_id: null,
        memo: '인프라 구축에 도움을 받았습니다.',
      },
    ];

    // 명함 생성
    const createdCards = [];
    for (const cardInput of mockCards) {
      const card = await createReceivedCard(cardInput);
      createdCards.push(card);
      console.log(`[MockData] 명함 생성: ${card.snapshot.display_name}`);
    }

    console.log(`[MockData] 테스트 데이터 생성 완료!`);
    console.log(`[MockData] - 폴더: ${[folder1, folder2, folder3].length}개`);
    console.log(`[MockData] - 명함: ${createdCards.length}개`);

    // 커뮤니티 mock 데이터도 함께 생성
    console.log('[MockData] 커뮤니티 데이터 생성 시작...');
    try {
      await generateCommunityMockData();
      console.log('[MockData] 커뮤니티 데이터 생성 완료!');
    } catch (err) {
      console.warn('[MockData] 커뮤니티 데이터 생성 실패 (무시):', err);
    }

    return {
      folders: [folder1, folder2, folder3],
      cards: createdCards,
    };
  } catch (error) {
    console.error('[MockData] 테스트 데이터 생성 실패:', error);
    throw error;
  }
}

/**
 * 모든 테스트 데이터 삭제 함수
 */
export async function clearMockData() {
  console.log('[MockData] 테스트 데이터 삭제 시작...');
  
  // 브라우저 콘솔에서 실행할 수 있도록 API를 직접 import
  const { getReceivedCards, getFolders, deleteReceivedCard, deleteFolder } = await import('../api/contactsApi');
  
  try {
    // 모든 명함 삭제
    const cards = await getReceivedCards();
    for (const card of cards) {
      await deleteReceivedCard(card.id);
    }
    console.log(`[MockData] 명함 ${cards.length}개 삭제 완료`);

    // 모든 폴더 삭제
    const folders = await getFolders();
    for (const folder of folders) {
      await deleteFolder(folder.id);
    }
    console.log(`[MockData] 폴더 ${folders.length}개 삭제 완료`);

    console.log('[MockData] 모든 테스트 데이터 삭제 완료!');
  } catch (error) {
    console.error('[MockData] 테스트 데이터 삭제 실패:', error);
    throw error;
  }
}

