import React, { useEffect, useRef } from 'react';
import { setBackInterceptor } from '../utils/backIntercept';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

// 중첩된 모달이 닫히면서 호출하는 history.back()이
// 부모 모달의 popstate 리스너를 트리거해 부모까지 닫히는 문제를 막기 위한 플래그.
// cleanup에서 history.back() 직전에 true로 설정하고, 이어서 발생하는 popstate 한 번을 무시한다.
let suppressNextPopstate = false;

export function FullScreenModal({ isOpen, onClose, title, children }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 뒤로가기 지원 (웹: popstate / 네이티브: backIntercept)
  useEffect(() => {
    if (!isOpen) return;

    // 웹 뒤로가기: 히스토리에 더미 상태를 push해두고 popstate 시 닫기
    history.pushState({ modalOpen: true }, '');
    const handlePopState = () => {
      if (suppressNextPopstate) {
        suppressNextPopstate = false;
        return;
      }
      onCloseRef.current();
    };
    window.addEventListener('popstate', handlePopState);

    // 네이티브 뒤로가기 (Capacitor)
    setBackInterceptor(() => onCloseRef.current());

    return () => {
      window.removeEventListener('popstate', handlePopState);
      setBackInterceptor(null);
      // 닫힐 때 더미 상태가 남아있으면 제거
      if (history.state?.modalOpen) {
        suppressNextPopstate = true;
        history.back();
        // 안전망: popstate가 발생하지 않으면 다음 tick에 플래그 자동 해제
        setTimeout(() => { suppressNextPopstate = false; }, 0);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[90vh] md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-2xl">
        {/* Header — 상태바 safe area 확보 */}
        <div
          className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
            paddingBottom: '0.75rem',
            minHeight: 'calc(4rem + env(safe-area-inset-top))',
          }}
        >
          <h2 className="text-lg font-semibold text-slate-900">{title || ''}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:bg-slate-200"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Content — 하단 내비게이션 바 safe area 확보 */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

