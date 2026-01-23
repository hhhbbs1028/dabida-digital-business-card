    import type { ReceivedCardSnapshot } from '../types';

/**
 * 받은 명함의 organization, headline 등을 분석하여
 * 자동으로 폴더명을 추천하는 함수
 */
export function suggestFolderName(snapshot: ReceivedCardSnapshot): string | null {
  const org = snapshot.organization?.toLowerCase() || '';
  const headline = snapshot.headline?.toLowerCase() || '';
  const text = `${org} ${headline}`;

  // 학교/대학교 키워드
  const universityKeywords = [
    '대학교',
    '대학',
    'university',
    'college',
    '서울대',
    '연세대',
    '고려대',
    '한양대',
    '중앙대',
    '경희대',
    '이화여대',
    '성균관대',
  ];

  // 학과 키워드
  const majorKeywords = [
    '학과',
    '전공',
    '컴퓨터공학',
    '컴공',
    '전기전자',
    '기계공학',
    '산업공학',
    '경영학',
    '경제학',
    '심리학',
    '영어영문',
    '국어국문',
    'major',
    'department',
  ];

  // 동아리 키워드
  const clubKeywords = [
    '동아리',
    '클럽',
    '멋쟁이사자처럼',
    'likelion',
    'gdsc',
    'google developer',
    'sopt',
    'yapp',
    'nexters',
    'depromeet',
    'club',
    'circle',
    'society',
  ];

  // 학교 분류
  for (const keyword of universityKeywords) {
    if (text.includes(keyword)) {
      // 학교명 추출 시도
      const universityMatch = org.match(/([가-힣]+대학교?|[가-힣]+대학)/);
      if (universityMatch) {
        return universityMatch[1];
      }
      // 영어 학교명
      const engMatch = org.match(/([A-Za-z\s]+University|[A-Za-z\s]+College)/i);
      if (engMatch) {
        return engMatch[1].trim();
      }
      return '학교';
    }
  }

  // 학과 분류
  for (const keyword of majorKeywords) {
    if (text.includes(keyword)) {
      // 학과명 추출 시도
      const majorMatch = org.match(/([가-힣]+학과|[가-힣]+전공)/);
      if (majorMatch) {
        return majorMatch[1];
      }
      // headline에서 학과명 추출
      const headlineMatch = headline.match(/([가-힣]+학과|[가-힣]+전공)/);
      if (headlineMatch) {
        return headlineMatch[1];
      }
      return '학과';
    }
  }

  // 동아리 분류
  for (const keyword of clubKeywords) {
    if (text.includes(keyword)) {
      // 동아리명 추출 시도
      if (text.includes('멋쟁이사자처럼') || text.includes('likelion')) {
        return '멋쟁이사자처럼';
      }
      if (text.includes('gdsc') || text.includes('google developer')) {
        return 'GDSC';
      }
      if (text.includes('sopt')) {
        return 'SOPT';
      }
      if (text.includes('yapp')) {
        return 'YAPP';
      }
      if (text.includes('nexters')) {
        return 'NEXTERS';
      }
      if (text.includes('depromeet')) {
        return 'Depromeet';
      }
      return '동아리';
    }
  }

  // 회사/기업 키워드
  const companyKeywords = ['회사', '기업', 'corporation', 'corp', 'inc', 'ltd', 'co.'];
  for (const keyword of companyKeywords) {
    if (text.includes(keyword)) {
      // 회사명 추출 시도
      const companyMatch = org.match(/([가-힣A-Za-z\s]+(?:회사|기업|Corporation|Corp|Inc|Ltd|Co\.))/i);
      if (companyMatch) {
        return companyMatch[1].trim();
      }
      return '회사';
    }
  }

  return null;
}

/**
 * 받은 명함의 snapshot을 분석하여 자동 태그를 추천하는 함수
 */
export function suggestTags(snapshot: ReceivedCardSnapshot): string[] {
  const tags: string[] = [];
  const org = snapshot.organization?.toLowerCase() || '';
  const headline = snapshot.headline?.toLowerCase() || '';
  const text = `${org} ${headline}`;

  // 기술 스택 태그
  const techTags: { keyword: string; tag: string }[] = [
    { keyword: 'react', tag: 'React' },
    { keyword: 'vue', tag: 'Vue' },
    { keyword: 'angular', tag: 'Angular' },
    { keyword: 'javascript', tag: 'JavaScript' },
    { keyword: 'typescript', tag: 'TypeScript' },
    { keyword: 'python', tag: 'Python' },
    { keyword: 'java', tag: 'Java' },
    { keyword: 'spring', tag: 'Spring' },
    { keyword: 'node', tag: 'Node.js' },
    { keyword: 'frontend', tag: 'Frontend' },
    { keyword: 'backend', tag: 'Backend' },
    { keyword: 'fullstack', tag: 'Fullstack' },
    { keyword: 'ai', tag: 'AI' },
    { keyword: 'ml', tag: 'Machine Learning' },
    { keyword: 'design', tag: 'Design' },
    { keyword: 'ui/ux', tag: 'UI/UX' },
  ];

  for (const { keyword, tag } of techTags) {
    if (text.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // 역할 태그
  const roleTags: { keyword: string; tag: string }[] = [
    { keyword: '개발자', tag: '개발자' },
    { keyword: '디자이너', tag: '디자이너' },
    { keyword: '기획자', tag: '기획자' },
    { keyword: 'pm', tag: 'PM' },
    { keyword: 'developer', tag: 'Developer' },
    { keyword: 'designer', tag: 'Designer' },
    { keyword: 'engineer', tag: 'Engineer' },
  ];

  for (const { keyword, tag } of roleTags) {
    if (text.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}

