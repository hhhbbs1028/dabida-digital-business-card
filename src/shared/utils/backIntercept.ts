/**
 * 하드웨어 뒤로가기 버튼 인터셉터
 * ThemeEditor 같은 오버레이 컴포넌트가 하드웨어 백 버튼을 가로챌 때 사용
 */
let interceptor: (() => void) | null = null;

export function setBackInterceptor(fn: (() => void) | null): void {
  interceptor = fn;
}

/** 인터셉터가 있으면 실행하고 true 반환, 없으면 false 반환 */
export function consumeBackIntercept(): boolean {
  if (interceptor) {
    interceptor();
    return true;
  }
  return false;
}
