import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { useToast } from '../../../shared/ui/Toast';

type Props = {
  onScanSuccess: (url: string) => void;
  onClose?: () => void;
};

/** 네이티브(Android): MLKit 풀스크린 스캐너 사용. 웹: qr-scanner WebRTC 폴백 */
export function QRScanner({ onScanSuccess, onClose }: Props) {
  const { showToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── 네이티브 스캐너 (Android) ──────────────────────────────────────────────
  const startNativeScan = async () => {
    try {
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera !== 'granted') {
        const { camera: granted } = await BarcodeScanner.requestPermissions();
        if (granted !== 'granted') {
          setError('카메라 권한이 필요합니다. 설정에서 권한을 허용해 주세요.');
          return;
        }
      }

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });

      if (barcodes.length > 0 && barcodes[0].rawValue) {
        onScanSuccess(barcodes[0].rawValue);
      }
      onClose?.();
    } catch (err: any) {
      const msg = err?.message ?? '스캔에 실패했습니다.';
      if (msg.includes('canceled') || msg.includes('cancelled')) {
        onClose?.();
        return;
      }
      setError(msg);
      showToast('QR 스캔에 실패했습니다.', 'error');
    }
  };

  // ── 웹 폴백 스캐너 (WebRTC) ───────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const webScannerRef = useRef<any>(null);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const cleanupWebScanner = () => {
    const scanner = webScannerRef.current;
    if (!scanner) return;
    webScannerRef.current = null;
    try { scanner.stop(); } catch {}
    try { scanner.destroy(); } catch {}
  };

  const startWebScan = async () => {
    const QrScanner = (await import('qr-scanner')).default;
    const videoElement = videoRef.current;
    if (!videoElement) return;

    try {
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) throw new Error('사용 가능한 카메라를 찾을 수 없습니다.');

      const qrScanner = new QrScanner(
        videoElement,
        (result: any) => {
          onScanSuccessRef.current(result.data);
          cleanupWebScanner();
          setIsScanning(false);
          onClose?.();
        },
        { preferredCamera: 'environment', maxScansPerSecond: 5 },
      );

      webScannerRef.current = qrScanner;
      await qrScanner.start();
      setIsScanning(true);
    } catch (err: any) {
      const msg = err?.message ?? '카메라를 시작할 수 없습니다.';
      setError(msg);
      if (!window.isSecureContext) {
        showToast('카메라 사용을 위해 HTTPS 연결이 필요합니다.', 'error');
      } else {
        showToast('카메라를 시작할 수 없습니다.', 'error');
      }
    }
  };

  // ── 진입점 ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      void startNativeScan();
    } else {
      void startWebScan();
    }

    return () => {
      if (!Capacitor.isNativePlatform()) cleanupWebScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (!Capacitor.isNativePlatform()) cleanupWebScanner();
    onClose?.();
  };

  // 네이티브에서는 스캐너가 풀스크린으로 열리므로 UI 최소화
  if (Capacitor.isNativePlatform()) {
    return (
      <div className="flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">QR 코드 스캔</h3>
          <p className="mt-1 text-sm text-slate-500">카메라가 자동으로 열립니다.</p>
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
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-5xl">📷</div>
            <p className="text-sm text-slate-500">QR 스캐너를 시작하는 중...</p>
            {onClose && (
              <button
                type="button"
                onClick={handleClose}
                className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                취소
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // 웹 폴백 UI
  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">QR 코드 스캔</h3>
        <p className="mt-1 text-sm text-slate-500">상대방의 명함 QR 코드를 카메라로 스캔하세요.</p>
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
          <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900">
            <video
              ref={videoRef}
              className="h-full w-full"
              style={{ minHeight: '300px', width: '100%', objectFit: 'cover' }}
              playsInline
              muted
            />
            {!isScanning && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-800">
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
