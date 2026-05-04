/**
 * useTextWidthPct
 *
 * 자식 요소의 실제 렌더 폭을 컨테이너 폭 대비 백분율(%)로 추적한다.
 * `getRenderedLeftX(centerX, widthPct)` 와 함께 텍스트 좌측 정렬 렌더에 사용.
 *
 * 사용 예:
 *   const cardRef = useRef<HTMLDivElement>(null);
 *   const [textRef, widthPct] = useTextWidthPct(cardRef);
 *   const leftX = getRenderedLeftX(pos.x, widthPct);
 *
 * 동작:
 *  - useLayoutEffect 로 첫 측정을 페인트 직전에 끝내 첫 프레임 흐름을 방지.
 *  - ResizeObserver 가 텍스트 폭/카드 폭 변화에 자동 대응(텍스트 입력·뷰포트 리사이즈).
 */

import { type RefObject, useLayoutEffect, useRef, useState } from 'react';

export function useTextWidthPct(
  containerRef: RefObject<HTMLElement | null>,
): readonly [RefObject<HTMLDivElement | null>, number] {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [widthPct, setWidthPct] = useState(0);

  useLayoutEffect(() => {
    const el = elementRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const measure = () => {
      const elW = el.offsetWidth;
      const containerW = container.offsetWidth;
      if (containerW <= 0) return;
      const next = (elW / containerW) * 100;
      setWidthPct((prev) => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef]);

  return [elementRef, widthPct] as const;
}
