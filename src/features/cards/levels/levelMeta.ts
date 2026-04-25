import type { CardLevel } from './computeCardLevel';

export type LevelMeta = {
  label: string;
  description: string;
  bgClass: string;
  textClass: string;
  ringClass: string;
};

// 3단계는 컬러 계열로 의미를 분리하되, 톤은 모두 절제해서 위계만 살린다.
//   My     → 슬레이트 라이트 ghost pill (가벼움)
//   Social → 깊은 모스그린 라이트 틴트 (활기·연결)
//   Pro    → 솔리드 토스블루 (정장·신뢰)
// 라이트 틴트(50) + 진한 텍스트(700) 조합으로 비비드 색을 피한다(CLAUDE.md).
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
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    ringClass: 'ring-1 ring-inset ring-emerald-100',
  },

  pro: {
    label: 'Pro',
    description: '이력과 상세 정보가 담긴 비즈니스용 명함이에요. 채용·협업·공식 자리에서 신뢰를 더해줘요.',
    bgClass: 'bg-primary-600',
    textClass: 'text-white',
    ringClass: 'ring-1 ring-inset ring-primary-500',
  },
};
