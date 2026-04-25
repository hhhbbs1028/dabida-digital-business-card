import type { CardLevel } from './computeCardLevel';

export type LevelMeta = {
  label: string;
  description: string;
  bgClass: string;
  textClass: string;
  ringClass: string;
};

// 3단계는 같은 슬레이트/토스블루 팔레트 안에서 "톤의 격"으로 구분한다.
//   My     → 조용한 그레이 ghost pill (가벼움)
//   Social → 토스블루 라이트 틴트 (활성·연결)
//   Pro    → 솔리드 슬레이트 다크 (정장·신뢰)
// 비비드 색 금지 규칙(CLAUDE.md)을 따르고, 액센트는 한 톤에만 집중시킨다.
export const LEVEL_META: Record<CardLevel, LevelMeta> = {
  my: {
    label: 'My',
    description: '이름·소속 정도가 담긴 가벼운 명함이에요. 가까운 사람과 빠르게 주고받기 좋아요.',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-500',
    ringClass: 'ring-1 ring-inset ring-slate-200/70',
  },

  social: {
    label: 'Social',
    description: '연락처와 SNS가 담긴 네트워킹용 명함이에요. 새로 만난 사람과 자연스럽게 이어지기 좋아요.',
    bgClass: 'bg-primary-50',
    textClass: 'text-primary-700',
    ringClass: 'ring-1 ring-inset ring-primary-100',
  },

  pro: {
    label: 'Pro',
    description: '이력과 상세 정보가 담긴 비즈니스용 명함이에요. 채용·협업·공식 자리에서 신뢰를 더해줘요.',
    bgClass: 'bg-slate-900',
    textClass: 'text-white',
    ringClass: 'ring-1 ring-inset ring-slate-900',
  },
};
