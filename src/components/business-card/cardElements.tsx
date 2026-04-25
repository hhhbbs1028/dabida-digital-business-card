/**
 * cardElements — 명함 텍스트 요소 공통 렌더 모듈
 *
 * BusinessCard(정적 뷰)와 CardCanvas(편집 캔버스) 두 렌더 코드베이스가
 * 공유하는 "어떤 텍스트 요소가 있고, 각 요소는 어떤 내용을 어떤 스타일로
 * 그리는가"의 단일 출처. 새 요소·아이콘 추가 시 이 파일만 수정하면
 * 두 렌더 경로가 자동 동기화된다.
 *
 * 외곽 래퍼(AbsElem / DraggableElement), 드래그·리사이즈 로직, 프로필,
 * 스티커 렌더는 각 파일에서 그대로 담당한다.
 *
 * 폰트·아이콘은 renderHelpers의 cqw 기반 단위를 사용하므로, 호출 측은
 * 카드 외곽 div에 `containerType: 'inline-size'`를 적용해야 한다.
 */

import React from 'react';
import { Globe, HardDrive, Mail, Phone } from 'lucide-react';
import type { CardContentTokens } from '../../theme/types';
import type { RenderHelpers } from '../../theme/renderHelpers';

// ============================================================================
// 인라인 SVG 아이콘 (lucide-react deprecated 소셜 아이콘 대체)
// IconWrap 안에서 width/height 100%로 부모 크기에 맞춰 그려진다.
// ============================================================================

const SVG_BASE = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: '100%',
  height: '100%',
};

export const IgIcon = () => (
  <svg {...SVG_BASE}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

export const GhIcon = () => (
  <svg {...SVG_BASE}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

export const LiIcon = () => (
  <svg {...SVG_BASE}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);

// ============================================================================
// IconWrap — 모든 아이콘을 카드 폭 비례 크기(cqw)로 렌더하는 컨테이너
// ============================================================================

function IconWrap({ size, children }: { size: string; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

// ============================================================================
// 요소 메타 테이블
// ============================================================================

export type TextElementKey =
  | 'name' | 'tagline' | 'major'
  | 'email' | 'phone'
  | 'instagram' | 'github' | 'website' | 'linkedin' | 'google_drive';

type RenderArgs = {
  helpers: RenderHelpers;
  fontScale: number;
  value: string;
  isEditing: boolean;
};

type TextElementDef = {
  key: TextElementKey;
  label: string;
  placeholder: string;
  getValue: (data: CardContentTokens) => string | undefined;
  /** true면 값이 없어도 placeholder를 렌더(이름 전용). */
  alwaysRender?: boolean;
  render: (args: RenderArgs) => React.ReactNode;
};

// 편집 캔버스에서 텍스트 자체가 포인터를 가로채면 드래그가 끊기므로 차단.
const pe = (isEditing: boolean): React.CSSProperties =>
  isEditing ? { pointerEvents: 'none' } : {};

// 링크형(아이콘 + 값) 요소 렌더러 — 동일 패턴이 7개라 헬퍼로 추출.
function renderLinkLine(args: RenderArgs, Icon: React.ComponentType) {
  const { helpers, fontScale, value, isEditing } = args;
  return (
    <span style={helpers.linkStyle(fontScale, isEditing)}>
      <IconWrap size={helpers.iconSize}><Icon /></IconWrap>
      {value}
    </span>
  );
}

export const TEXT_ELEMENTS: readonly TextElementDef[] = [
  {
    key: 'name',
    label: '이름',
    placeholder: 'Your Name',
    alwaysRender: true,
    getValue: (d) => d.name,
    render: ({ helpers, fontScale, value, isEditing }) => (
      <div style={{
        fontFamily: 'var(--card-title-font)',
        fontWeight: 'var(--card-title-weight)',
        color: 'var(--card-primary)',
        fontSize: helpers.nameFontSize(fontScale),
        whiteSpace: 'nowrap',
        ...pe(isEditing),
      }}>
        {value}
      </div>
    ),
  },
  {
    key: 'tagline',
    label: '한 줄 소개',
    placeholder: '(한 줄 소개)',
    getValue: (d) => d.tagline,
    render: ({ helpers, fontScale, value, isEditing }) => (
      <div style={helpers.textStyle('--card-secondary', '0.7rem', '0.875rem', fontScale, isEditing)}>
        {value}
      </div>
    ),
  },
  {
    key: 'major',
    label: '소속',
    placeholder: '(소속)',
    getValue: (d) => d.major,
    render: ({ helpers, fontScale, value, isEditing }) => (
      <div style={{
        ...helpers.textStyle('--card-accent', '0.6rem', '0.75rem', fontScale, isEditing),
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {value}
      </div>
    ),
  },
  {
    key: 'email',
    label: '이메일',
    placeholder: '(이메일)',
    getValue: (d) => d.email,
    render: (args) => renderLinkLine(args, () => <Mail width="100%" height="100%" />),
  },
  {
    key: 'phone',
    label: '전화',
    placeholder: '(전화)',
    getValue: (d) => d.phone,
    render: (args) => renderLinkLine(args, () => <Phone width="100%" height="100%" />),
  },
  {
    key: 'instagram',
    label: '인스타',
    placeholder: '(인스타그램)',
    getValue: (d) => d.links?.instagram,
    render: (args) => renderLinkLine(args, IgIcon),
  },
  {
    key: 'github',
    label: '깃허브',
    placeholder: '(깃허브)',
    getValue: (d) => d.links?.github,
    render: (args) => renderLinkLine(args, GhIcon),
  },
  {
    key: 'website',
    label: '웹사이트',
    placeholder: '(웹사이트)',
    getValue: (d) => d.links?.website,
    render: (args) => renderLinkLine(args, () => <Globe width="100%" height="100%" />),
  },
  {
    key: 'linkedin',
    label: '링크드인',
    placeholder: '(링크드인)',
    getValue: (d) => d.links?.linkedin,
    render: (args) => renderLinkLine(args, LiIcon),
  },
  {
    key: 'google_drive',
    label: '드라이브',
    placeholder: '(드라이브)',
    getValue: (d) => d.links?.google_drive,
    render: (args) => renderLinkLine(args, () => <HardDrive width="100%" height="100%" />),
  },
];

// ============================================================================
// 표시 여부 / 값 결정 헬퍼
// ============================================================================

/** 값이 없을 때 alwaysRender·isEditing 여부에 따라 placeholder를 채워 반환. 빈 문자열이면 렌더 안 함. */
export function resolveElementValue(
  def: TextElementDef,
  data: CardContentTokens,
  isEditing: boolean,
): string {
  const v = def.getValue(data);
  if (v) return v;
  if (def.alwaysRender || isEditing) return def.placeholder;
  return '';
}

/** static 뷰(BusinessCard) 기준: 값이 있거나 alwaysRender면 렌더. */
export function shouldRenderInStatic(def: TextElementDef, data: CardContentTokens): boolean {
  return !!def.alwaysRender || !!def.getValue(data);
}

/** editing 뷰(CardCanvas) 기준: 값이 있거나 alwaysRender거나 selected면 렌더. */
export function shouldRenderInEditing(
  def: TextElementDef,
  data: CardContentTokens,
  selectedKey: string | null,
): boolean {
  return !!def.alwaysRender || !!def.getValue(data) || selectedKey === def.key;
}
