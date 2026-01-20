import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useToast } from '../../../shared/ui/Toast';

type Props = {
  onScanSuccess: (url: string) => void;
  onClose?: () => void;
};

export function QRScanner({ onScanSuccess, onClose }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const stopScan = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('[QRScanner] 스캔 정지 오류:', err);
      }
      html5QrCodeRef.current = null;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const startScan = async () => {
      if (!scannerRef.current) return;

      try {
        const scannerId = 'qr-scanner-' + Date.now();
        scannerRef.current.id = scannerId;
        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        // 카메라 시작
        await html5QrCode.start(
          { facingMode: 'environment' }, // 후면 카메라 우선
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // QR 코드 스캔 성공
            if (mounted) {
              console.log('[QRScanner] 스캔 성공:', decodedText);
              onScanSuccess(decodedText);
              // 스캔 성공 후 정리
              void stopScan();
            }
          },
          (errorMessage) => {
            // 스캔 중 오류 (계속 시도 중이므로 무시)
            // console.debug('[QRScanner] 스캔 중:', errorMessage);
          },
        );

        if (mounted) {
          setIsScanning(true);
          setError(null);
        }
      } catch (err: any) {
        console.error('[QRScanner] 카메라 시작 오류:', err);
        if (mounted) {
          setError(err?.message ?? '카메라를 시작할 수 없습니다.');
          setIsScanning(false);
          if (err?.message?.includes('Permission denied') || err?.message?.includes('NotAllowedError')) {
            showToast('카메라 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.', 'error');
          } else {
            showToast('카메라를 시작할 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.', 'error');
          }
        }
      }
    };

    void startScan();

    return () => {
      mounted = false;
      void stopScan();
    };
  }, [onScanSuccess, showToast, isScanning]);

  const handleClose = () => {
    void stopScan();
    onClose?.();
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">QR 코드 스캔</h3>
        <p className="mt-1 text-sm text-slate-500">
          상대방의 명함 QR 코드를 카메라로 스캔하세요.
        </p>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mb-4 text-4xl">📷</div>
          <p className="mb-2 text-sm font-medium text-red-800">카메라 오류</p>
          <p className="text-xs text-red-600">{error}</p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            닫기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            ref={scannerRef}
            className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900"
            style={{ minHeight: '300px' }}
          >
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="text-center text-white">
                  <div className="mb-2 text-2xl">📷</div>
                  <p className="text-sm">카메라 시작 중...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
            <span>💡</span>
            <span>QR 코드를 카메라 중앙에 맞춰주세요</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              스캔 취소
            </button>
          )}
        </div>
      )}
    </div>
  );
}

