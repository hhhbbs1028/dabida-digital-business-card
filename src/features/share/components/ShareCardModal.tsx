import React, { useMemo, useRef } from 'react';
import QRCode from 'react-qr-code';
import { useToast } from '../../../shared/ui/Toast';

type Props = {
  cardId: string;
  onClose: () => void;
};

function getAppOrigin() {
  const envOrigin = import.meta.env.VITE_PUBLIC_APP_ORIGIN as string | undefined;
  if (envOrigin && typeof envOrigin === 'string' && envOrigin.trim().length > 0) {
    return envOrigin.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function ShareCardModal({ cardId, onClose }: Props) {
  const { showToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const origin = getAppOrigin();
  const shareUrl = useMemo(() => {
    if (!origin) return '';
    return `${origin}/c/${cardId}`;
  }, [origin, cardId]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      // 1순위: 최신 Clipboard API (https 또는 localhost 등 secure context)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // 2순위: 예전 방식 fallback
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('execCommand copy failed');
        }
      }

      showToast('공유 링크를 복사했어요.', 'success');
    } catch (error) {
      console.error('[ShareCardModal] 링크 복사 오류:', error);
      showToast('링크 복사에 실패했습니다. 직접 복사해 주세요.', 'error');
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      // SVG를 canvas로 변환
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // PNG로 다운로드
          canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dabida-card-${cardId.substring(0, 8)}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('QR 코드를 다운로드했어요.', 'success');
          });
        }
      };

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    } catch (error) {
      console.error('[ShareCardModal] QR 다운로드 오류:', error);
      showToast('QR 코드 다운로드에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">명함 공유</h2>
        <p className="mt-1 text-sm text-slate-500">
          링크를 복사하거나 QR 코드를 스캔해서 상대방에게 명함을 공유하세요.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 왼쪽: QR 코드 */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-500">QR 코드</label>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6">
            <div ref={qrRef} className="rounded-xl bg-white p-4">
              {shareUrl ? (
                <QRCode
                  value={shareUrl}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
                  QR 생성 불가
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={!shareUrl}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              QR 저장 (PNG)
            </button>
          </div>
        </div>

        {/* 오른쪽: 링크 */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-500">공유 링크</label>
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="break-all text-xs text-slate-700">
                {shareUrl || 'origin 정보를 불러올 수 없습니다.'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!shareUrl}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              링크 복사
            </button>
            <p className="text-[11px] leading-relaxed text-slate-400">
              링크를 복사하거나 QR 코드를 스캔하면 이 명함을 볼 수 있어요.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          닫기
        </button>
      </div>
    </div>
  );
}


