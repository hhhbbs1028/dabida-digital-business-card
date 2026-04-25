import type { CardLevel } from './computeCardLevel';

export type LevelMeta = {
  label: string;
  description: string;
  bgClass: string;
  textClass: string;
  ringClass: string;
};

export const LEVEL_META: Record<CardLevel, LevelMeta> = {
  my: {
    label: 'My',
    description: '가까운 사람과 가볍게 주고받는 명함이에요.',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
    ringClass: 'ring-1 ring-slate-200',
  },
  social: {
    label: 'Social',
    description: '연락처와 SNS가 포함된 일상 네트워킹용 명함이에요.',
    bgClass: 'bg-primary-50',
    textClass: 'text-primary-600',
    ringClass: 'ring-1 ring-primary-100',
  },
  pro: {
    label: 'Pro',
    description: '공식 연락처와 이력 자료까지 포함된 비즈니스용 명함이에요.',
    bgClass: 'bg-slate-900',
    textClass: 'text-white',
    ringClass: '',
  },
};
