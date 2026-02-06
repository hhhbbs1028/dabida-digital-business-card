/**
 * Layout Capabilities
 * 
 * 레이아웃별 허용 옵션을 정의
 * 템플릿별로 제한된 옵션만 제공하여 일관성 유지
 * 
 * 설계 원칙:
 * - 각 레이아웃은 고유한 capability를 가짐
 * - v1에서는 간단한 boolean 플래그로 관리
 * - 추후 확장 시 더 세밀한 제어 가능
 */

import type { LayoutId } from './types';

/**
 * 레이아웃별 기능 정의
 */
export interface LayoutCapabilities {
  /** 프로필 없음(none) 허용 여부 */
  allowProfileNone: boolean;
  /** 패턴 배경 허용 여부 */
  allowPattern: boolean;
  /** 그라데이션 배경 허용 여부 */
  allowGradient: boolean;
  /** 프로필 circle 모양 허용 여부 */
  allowProfileCircle: boolean;
  /** 프로필 rounded 모양 허용 여부 */
  allowProfileRounded: boolean;
}

/**
 * 레이아웃별 capabilities 맵
 */
export const LAYOUT_CAPABILITIES: Record<LayoutId, LayoutCapabilities> = {
  // minimal_01: 미니멀 레이아웃
  // - 프로필 없음 허용
  // - 모든 배경 타입 허용
  // - 프로필 모양 제한 없음
  minimal_01: {
    allowProfileNone: true,
    allowPattern: true,
    allowGradient: true,
    allowProfileCircle: true,
    allowProfileRounded: true,
  },

  // split_01: 분할 레이아웃
  // - 프로필 필수 (none 불가)
  // - 모든 배경 타입 허용
  // - 프로필 모양 제한 없음
  split_01: {
    allowProfileNone: false,
    allowPattern: true,
    allowGradient: true,
    allowProfileCircle: true,
    allowProfileRounded: true,
  },
};

/**
 * 특정 레이아웃의 capability 조회
 * 
 * @param layoutId - 레이아웃 ID
 * @returns 해당 레이아웃의 capabilities
 */
export function getLayoutCapabilities(layoutId: LayoutId): LayoutCapabilities {
  return LAYOUT_CAPABILITIES[layoutId];
}

/**
 * 특정 옵션이 레이아웃에서 허용되는지 확인
 * 
 * @param layoutId - 레이아웃 ID
 * @param option - 확인할 옵션 키
 * @returns 허용 여부
 */
export function isOptionAllowed(
  layoutId: LayoutId,
  option: keyof LayoutCapabilities,
): boolean {
  const capabilities = getLayoutCapabilities(layoutId);
  return capabilities[option] ?? false;
}

