import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useToast } from '../../../shared/ui/Toast';
import { BottomSheet } from '../../../shared/ui/BottomSheet';

type Props = {
  cardId: string;
  hasResume?: boolean;
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

export function ShareCardModal({ cardId, hasResume = false, onClose }: Props) {
  const { showToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const origin = getAppOrigin();
  // 이력서 포함 여부. 모달이 열릴 때마다 BottomSheet으로 다시 묻는다.
  const [includeResume, setIncludeResume] = useState(true);
  const [resumeSheetOpen, setResumeSheetOpen] = useState(false);

  useEffect(() => {
    if (hasResume) {
      setResumeSheetOpen(true);
      setIncludeResume(true);
    } else {
      setResumeSheetOpen(false);
    }
  }, [hasResume, cardId]);

  const shareUrl = useMemo(() => {
    if (!origin) return '';
    const base = `${origin}/c/${cardId}`;
    if (hasResume && !includeResume) {
      return `${base}?exclude=resume`;
    }
    return base;
  }, [origin, cardId, hasResume, includeResume]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      if (Capacitor.isNativePlatform()) {
        // 네이티브: Capacitor Clipboard 플러그인 (HTTPS/포커스 조건 불필요)
        await Clipboard.write({ string: shareUrl });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // 웹 폴백
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!ok) throw new Error('execCommand copy failed');
      }

      showToast('공유 링크를 복사했어요.', 'success');
    } catch (error) {
      console.error('[ShareCardModal] 링크 복사 오류:', error);
      showToast('링크 복사에 실패했습니다. 직접 복사해 주세요.', 'error');
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (!ctx) return;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      try {
        if (Capacitor.isNativePlatform()) {
          // 네이티브: 파일로 저장 후 공유 시트 표시
          const base64 = canvas.toDataURL('image/png').split(',')[1];
          const fileName = `dabida-card-${cardId.substring(0, 8)}.png`;
          await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
          });
          const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
          await Share.share({
            title: '내 디지털 명함 QR 코드',
            url: uri,
            dialogTitle: '공유하기',
          });
        } else {
          // 웹: <a download> 방식
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
      } catch (error) {
        console.error('[ShareCardModal] QR 저장/공유 오류:', error);
        showToast('QR 코드 저장에 실패했습니다.', 'error');
      }
    };

    try {
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      img.src = URL.createObjectURL(svgBlob);
    } catch (error) {
      console.error('[ShareCardModal] QR 변환 오류:', error);
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

      {hasResume && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700">
              이력서 {includeResume ? '포함' : '제외'} 공유 중
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {includeResume
                ? '받는 사람도 이력서 링크를 볼 수 있어요.'
                : '이력서 링크는 받는 사람에게 보이지 않아요.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResumeSheetOpen(true)}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            변경
          </button>
        </div>
      )}

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
              {Capacitor.isNativePlatform() ? 'QR 공유하기' : 'QR 저장 (PNG)'}
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

      <BottomSheet
        isOpen={resumeSheetOpen}
        onClose={() => setResumeSheetOpen(false)}
        title="이력서를 포함해서 공유할까요?"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-500">
            이 명함의 Pro 정보(이력서 링크)는 받는 사람도 함께 받게 돼요. 어떻게 공유할지 선택해주세요.
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setIncludeResume(true);
                setResumeSheetOpen(false);
              }}
              className="w-full rounded-2xl bg-primary-500 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600"
            >
              포함해서 공유
            </button>
            <button
              type="button"
              onClick={() => {
                setIncludeResume(false);
                setResumeSheetOpen(false);
              }}
              className="w-full rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              제외하고 공유
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}


