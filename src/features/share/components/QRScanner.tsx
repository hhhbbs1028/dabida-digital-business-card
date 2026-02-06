import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { useToast } from '../../../shared/ui/Toast';

type Props = {
  onScanSuccess: (url: string) => void;
  onClose?: () => void;
};

export function QRScanner({ onScanSuccess, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const isDestroyedRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // onScanSuccess를 ref에 저장하여 의존성 문제 해결
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  // cleanup 함수를 별도로 분리
  const cleanupScanner = React.useCallback(() => {
    if (isDestroyedRef.current) {
      return;
    }
    isDestroyedRef.current = true;

    const scanner = qrScannerRef.current;
    if (!scanner) {
      return;
    }

    qrScannerRef.current = null;

    // 동기적으로 즉시 정리 (Promise를 기다리지 않음)
    try {
      scanner.stop();
    } catch {
      // stop 실패는 무시
    }

    try {
      scanner.destroy();
    } catch {
      // destroy 실패는 무시
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    const startScan = async () => {
      try {
        // 카메라 권한 확인
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          throw new Error('사용 가능한 카메라를 찾을 수 없습니다.');
        }

        // qr-scanner 인스턴스 생성
        const qrScanner = new QrScanner(
          videoElement,
          (result) => {
            // QR 코드 스캔 성공
            if (mounted && !isDestroyedRef.current) {
              console.log('[QRScanner] 스캔 성공:', result.data);
              onScanSuccessRef.current(result.data);
              // 스캔 성공 후 정리
              cleanupScanner();
              setIsScanning(false);
            }
          },
          {
            preferredCamera: 'environment', // 후면 카메라 우선
            maxScansPerSecond: 5,
            returnDetailedScanResult: false,
          },
        );

        qrScannerRef.current = qrScanner;

        // 카메라 시작
        await qrScanner.start();

        if (mounted && !isDestroyedRef.current) {
          setIsScanning(true);
          setError(null);
        }
      } catch (err: any) {
        console.error('[QRScanner] 카메라 시작 오류:', err);
        if (mounted && !isDestroyedRef.current) {
          const errorMsg = err?.message ?? '카메라를 시작할 수 없습니다.';
          setError(errorMsg);
          setIsScanning(false);

          // HTTPS 관련 오류 체크
          const isSecureContext = window.isSecureContext || location.protocol === 'https:';
          if (!isSecureContext) {
            showToast('카메라 사용을 위해 HTTPS 연결이 필요합니다. ngrok HTTPS URL로 접속해주세요.', 'error');
          } else if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
            showToast('카메라 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.', 'error');
          } else if (errorMsg.includes('streaming not supported') || errorMsg.includes('Camera streaming')) {
            showToast('이 브라우저에서는 카메라 스트리밍을 지원하지 않습니다. 다른 브라우저를 사용해주세요.', 'error');
          } else {
            showToast('카메라를 시작할 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.', 'error');
          }
        }
        qrScannerRef.current = null;
      }
    };

    // 약간의 지연을 두고 시작 (DOM이 완전히 준비되도록)
    const startTimeout = setTimeout(() => {
      if (mounted && !isDestroyedRef.current) {
        void startScan();
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(startTimeout);
      // 컴포넌트 언마운트 시 즉시 정리 (동기적으로)
      cleanupScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 의존성 배열 - 마운트 시 한 번만 실행

  const handleClose = () => {
    cleanupScanner();
    setIsScanning(false);
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
          <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900">
            <video
              ref={videoRef}
              className="h-full w-full"
              style={{ 
                minHeight: '300px',
                width: '100%',
                objectFit: 'cover',
              }}
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

