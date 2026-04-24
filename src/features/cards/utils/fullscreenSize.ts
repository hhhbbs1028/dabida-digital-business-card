/**
 * fullscreenSize
 *
 * 전체화면 편집기(FullscreenCardEditor)의 카드 크기·레이아웃 계산 헬퍼.
 *
 * 설계 이유:
 *   과거에는 `cardMaxWidthByHeight`, `'min(100%, calc(100vh * 1.8))'`,
 *   `'min(100%, calc((100vh - 28vh) * 1.8))'`, `'100%'` 등 4종의 폭 문자열이
 *   편집기 코드 여러 분기에 흩어져 있어 "같은 카드가 모드 전환 시 폰트 픽셀
 *   크기가 튀어보이는" divergence 원인이 되었다. 레이아웃 상수·수식을 이 유틸로
 *   모아 단일 소스에서 관리한다.
 *
 * 사용법:
 *   // portrait 레이아웃 (세로 카드 또는 CSS 회전된 가로 카드):
 *   <CardCanvas maxWidthOverride={cardMaxWidthPortraitLayout()} />
 *
 *   // 가로 뷰포트에서 가로 카드 (네이티브 가로 레이아웃):
 *   <div style={{ width: cardMaxWidthLandscapeViewport(panelOpen) }}>
 *     <CardCanvas maxWidthOverride="100%" />
 *   </div>
 */

// 전체화면 편집기 공통 레이아웃 상수 (px / vh).
// FullscreenCardEditor가 로컬 상수(`tabBarHeight` 등)를 파생시킬 때 동일 값을 쓴다.
export const FULLSCREEN_LAYOUT = {
  /** 상단 닫기 버튼 영역 패딩 (px) */
  topPadding: 52,
  /** 하단 고정 탭바 높이 (px) */
  tabBarHeight: 68,
  /** 상·하 여백 추가분 (px) — 카드가 탭바/상단에 붙지 않도록 */
  verticalGap: 16,
  /** 세로 레이아웃 플로팅 툴 패널 최대 높이 (vh) */
  floatingPanelMaxVh: 50,
  /** 가로 뷰포트 전용 하단 옵션 패널 높이 (vh) */
  landscapeSheetMaxVh: 28,
} as const;

// 명함 aspect ratio — aspect 9:5 의 수치 표현.
// 높이(vh)를 폭(vw)로 환산할 때 곱해서 사용.
const LANDSCAPE_ASPECT = 1.8; // 9 / 5

/**
 * portrait 레이아웃(세로 카드 또는 CSS 회전된 가로 카드)에서
 * 카드가 차지할 수 있는 최대 너비 문자열.
 *
 * 세로 카드 aspect 5:9 → `width = 가용높이 × 5/9`.
 * 가용높이 = 100vh − topPadding − tabBarHeight − verticalGap.
 * 실제 폭은 `min(90%, 계산값)`으로 뷰포트 폭도 함께 제한한다.
 */
export function cardMaxWidthPortraitLayout(): string {
  const { topPadding, tabBarHeight, verticalGap } = FULLSCREEN_LAYOUT;
  const reserved = topPadding + tabBarHeight + verticalGap;
  return `min(90%, calc((100vh - ${reserved}px) * 5 / 9))`;
}

/**
 * 가로 뷰포트에서 가로 카드(네이티브 가로 레이아웃)가 차지할 수 있는 최대 너비.
 *
 * 가로 카드 aspect 9:5 → `width = 가용높이 × 1.8`.
 * `panelOpen=true`면 하단 옵션 패널(landscapeSheetMaxVh)만큼 높이를 차감한다.
 */
export function cardMaxWidthLandscapeViewport(panelOpen: boolean): string {
  const { landscapeSheetMaxVh } = FULLSCREEN_LAYOUT;
  const availHeight = panelOpen ? `(100vh - ${landscapeSheetMaxVh}vh)` : '100vh';
  return `min(100%, calc(${availHeight} * ${LANDSCAPE_ASPECT}))`;
}